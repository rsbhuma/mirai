use std::sync::Arc;
use tokio::sync::broadcast;
use serde_json::Value;
use uuid::Uuid;
use crate::config::Config;
use crate::error::AppResult;
use crate::websocket::{WebSocketManager, WebSocketMessage, WebSocketManagerTrait};
use crate::blockchain::SolanaClient;

#[derive(Clone)]
pub struct TransactionListener {
    config: Arc<Config>,
    solana_client: Arc<SolanaClient>,
    websocket_manager: Arc<dyn WebSocketManagerTrait>,
    stop_signal: Arc<tokio::sync::broadcast::Sender<()>>,
}

// Manual Debug implementation since dyn WebSocketManagerTrait doesn't implement Debug
impl std::fmt::Debug for TransactionListener {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("TransactionListener")
            .field("config", &self.config)
            .field("solana_client", &self.solana_client)
            .field("websocket_manager", &"<WebSocketManagerTrait>")
            .field("stop_signal", &"<broadcast::Sender>")
            .finish()
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TransactionEvent {
    pub signature: String,
    pub slot: u64,
    pub err: Option<Value>,
    pub memo: Option<String>,
    pub block_time: Option<i64>,
    pub accounts: Vec<String>,
    pub program_ids: Vec<String>,
    pub instructions: Vec<Value>,
    pub meta: Option<Value>,
}

impl TransactionListener {
    pub fn new(
        config: Arc<Config>,
        solana_client: Arc<SolanaClient>,
        websocket_manager: Arc<dyn WebSocketManagerTrait>,
    ) -> Self {
        let (stop_signal, _) = broadcast::channel(1);
        
        Self {
            config,
            solana_client,
            websocket_manager,
            stop_signal: Arc::new(stop_signal),
        }
    }

    pub async fn start_listening(&self) -> AppResult<()> {
        tracing::info!("Starting Solana transaction listener...");
        
        let mut stop_receiver = self.stop_signal.subscribe();
        
        // Clone necessary data for spawned tasks
        let config = self.config.clone();
        let solana_client = self.solana_client.clone();
        let websocket_manager = self.websocket_manager.clone();
        let stop_signal = self.stop_signal.clone();
        
        // Start multiple listeners for different transaction types as separate tasks
        let program_task = {
            let config = config.clone();
            let solana_client = solana_client.clone();
            let websocket_manager = websocket_manager.clone();
            let stop_signal = stop_signal.clone();
            async move {
                let listener = TransactionListener::new(config, solana_client, websocket_manager);
                listener.listen_to_program_transactions().await;
            }
        };
        
        let token_task = {
            let config = config.clone();
            let solana_client = solana_client.clone();
            let websocket_manager = websocket_manager.clone();
            let stop_signal = stop_signal.clone();
            async move {
                let listener = TransactionListener::new(config, solana_client, websocket_manager);
                listener.listen_to_token_transactions().await;
            }
        };
        
        let account_task = {
            let config = config.clone();
            let solana_client = solana_client.clone();
            let websocket_manager = websocket_manager.clone();
            let stop_signal = stop_signal.clone();
            async move {
                let listener = TransactionListener::new(config, solana_client, websocket_manager);
                listener.listen_to_account_transactions().await;
            }
        };
        
        tokio::spawn(program_task);
        tokio::spawn(token_task);
        tokio::spawn(account_task);
        
        tokio::select! {
            _ = async {
                // Keep the main task alive
                loop {
                    tokio::time::sleep(tokio::time::Duration::from_secs(60)).await;
                }
            } => {},
            _ = stop_receiver.recv() => {
                tracing::info!("Transaction listener stopped");
            }
        }
        
        Ok(())
    }

    pub fn stop(&self) {
        let _ = self.stop_signal.send(());
    }

    async fn listen_to_program_transactions(&self) {
        let program_id = self.config.commcoin_program_id.clone();
        let _rpc_url = self.config.solana_rpc_url.clone();
        let _websocket_manager = self.websocket_manager.clone();
        
        tracing::info!("Listening to program transactions: {}", program_id);
        
        loop {
            match self.subscribe_to_program_logs(&program_id).await {
                Ok(stream) => {
                    use futures_util::{StreamExt, pin_mut};
                    pin_mut!(stream);
                    while let Some(notification) = stream.next().await {
                        if let Ok(transaction) = self.parse_transaction_notification(notification).await {
                            // Print transaction details
                            tracing::info!("📡 PROGRAM TRANSACTION DETECTED:");
                            tracing::info!("   🎯 Program: {}", program_id);
                            tracing::info!("   🔗 Signature: {}", transaction.signature);
                            tracing::info!("   📊 Slot: {}", transaction.slot);
                            tracing::info!("   ⏰ Block Time: {}", transaction.block_time.unwrap_or(0));
                            tracing::info!("   👥 Accounts: {} involved", transaction.accounts.len());
                            tracing::info!("   📝 Memo: {}", transaction.memo.as_deref().unwrap_or("None"));
                            tracing::info!("   ❌ Error: {}", if transaction.err.is_some() { "Yes" } else { "No" });
                            
                            if let Err(e) = self.broadcast_transaction_event(transaction).await {
                                tracing::error!("Failed to broadcast transaction: {}", e);
                            }
                        }
                    }
                }
                Err(e) => {
                    tracing::error!("Program logs subscription failed: {}", e);
                    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                }
            }
        }
    }

    async fn listen_to_token_transactions(&self) {
        // Listen to SPL token program transactions
        let token_program_id = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        let _websocket_manager = self.websocket_manager.clone();
        
        tracing::info!("Listening to token transactions");
        
        loop {
            match self.subscribe_to_program_logs(token_program_id).await {
                Ok(stream) => {
                    use futures_util::{StreamExt, pin_mut};
                    pin_mut!(stream);
                    while let Some(notification) = stream.next().await {
                        if let Ok(transaction) = self.parse_transaction_notification(notification).await {
                            // Print transaction details
                            tracing::info!("🪙 TOKEN TRANSACTION DETECTED:");
                            tracing::info!("   🎯 Program: {}", token_program_id);
                            tracing::info!("   🔗 Signature: {}", transaction.signature);
                            tracing::info!("   📊 Slot: {}", transaction.slot);
                            tracing::info!("   ⏰ Block Time: {}", transaction.block_time.unwrap_or(0));
                            tracing::info!("   👥 Accounts: {} involved", transaction.accounts.len());
                            tracing::info!("   📝 Memo: {}", transaction.memo.as_deref().unwrap_or("None"));
                            tracing::info!("   ❌ Error: {}", if transaction.err.is_some() { "Yes" } else { "No" });
                            
                            if let Err(e) = self.broadcast_token_transaction(transaction).await {
                                tracing::error!("Failed to broadcast token transaction: {}", e);
                            }
                        }
                    }
                }
                Err(e) => {
                    tracing::error!("Token logs subscription failed: {}", e);
                    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                }
            }
        }
    }

    async fn listen_to_account_transactions(&self) {
        // Listen to specific account transactions (e.g., token accounts)
        let websocket_manager = self.websocket_manager.clone();
        
        tracing::info!("Listening to account transactions");
        
        // Get accounts to monitor from database or config
        let accounts_to_monitor = self.get_accounts_to_monitor().await;
        
        for account in accounts_to_monitor {
            let account_clone = account.clone();
            let websocket_manager_clone = websocket_manager.clone();
            
            tokio::spawn(async move {
                loop {
                    match Self::subscribe_to_account_logs(&account_clone).await {
                        Ok(stream) => {
                            use futures_util::{StreamExt, pin_mut};
                            pin_mut!(stream);
                            while let Some(notification) = stream.next().await {
                                if let Ok(transaction) = Self::parse_transaction_notification_static(notification).await {
                                    // Print transaction details
                                    tracing::info!("👤 ACCOUNT TRANSACTION DETECTED:");
                                    tracing::info!("   🎯 Account: {}", account_clone);
                                    tracing::info!("   🔗 Signature: {}", transaction.signature);
                                    tracing::info!("   📊 Slot: {}", transaction.slot);
                                    tracing::info!("   ⏰ Block Time: {}", transaction.block_time.unwrap_or(0));
                                    tracing::info!("   👥 Accounts: {} involved", transaction.accounts.len());
                                    tracing::info!("   📝 Memo: {}", transaction.memo.as_deref().unwrap_or("None"));
                                    tracing::info!("   ❌ Error: {}", if transaction.err.is_some() { "Yes" } else { "No" });
                                    
                                    if let Err(e) = Self::broadcast_account_transaction(websocket_manager_clone.clone(), transaction).await {
                                        tracing::error!("Failed to broadcast account transaction: {}", e);
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            tracing::error!("Account logs subscription failed for {}: {}", account_clone, e);
                            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                        }
                    }
                }
            });
        }
    }

    async fn subscribe_to_program_logs(&self, program_id: &str) -> AppResult<std::pin::Pin<Box<dyn futures::Stream<Item = Value> + Send>>> {
        use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
        use futures_util::{SinkExt, StreamExt};
        
        let ws_url = self.config.solana_ws_url.clone();
        let (ws_stream, _) = connect_async(ws_url).await
            .map_err(|e| crate::error::AppError::Internal(format!("WebSocket connection failed: {}", e)))?;
        
        let (mut write, read) = ws_stream.split();
        
        // Subscribe to program logs
        let subscribe_msg = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "logsSubscribe",
            "params": [
                {
                    "mentions": [program_id]
                },
                {
                    "commitment": "confirmed",
                    "encoding": "jsonParsed"
                }
            ]
        });
        
        write.send(Message::Text(subscribe_msg.to_string())).await
            .map_err(|e| crate::error::AppError::Internal(format!("Failed to send subscription: {}", e)))?;
        
        let stream = read.filter_map(|msg| async move {
            match msg {
                Ok(Message::Text(text)) => {
                    if let Ok(json) = serde_json::from_str::<Value>(&text) {
                        Some(json)
                    } else {
                        None
                    }
                }
                _ => None,
            }
        });
        
        // Create a pinned stream
        Ok(Box::pin(stream))
    }

    async fn subscribe_to_account_logs(account: &str) -> AppResult<std::pin::Pin<Box<dyn futures::Stream<Item = Value> + Send>>> {
        use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
        use futures_util::{SinkExt, StreamExt};
        
        let ws_url = "ws://localhost:8900"; // TODO: Get from config
        let (ws_stream, _) = connect_async(ws_url).await
            .map_err(|e| crate::error::AppError::Internal(format!("WebSocket connection failed: {}", e)))?;
        
        let (mut write, read) = ws_stream.split();
        
        // Subscribe to account logs
        let subscribe_msg = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "logsSubscribe",
            "params": [
                {
                    "mentions": [account]
                },
                {
                    "commitment": "confirmed",
                    "encoding": "jsonParsed"
                }
            ]
        });
        
        write.send(Message::Text(subscribe_msg.to_string())).await
            .map_err(|e| crate::error::AppError::Internal(format!("Failed to send subscription: {}", e)))?;
        
        let stream = read.filter_map(|msg| async move {
            match msg {
                Ok(Message::Text(text)) => {
                    if let Ok(json) = serde_json::from_str::<Value>(&text) {
                        Some(json)
                    } else {
                        None
                    }
                }
                _ => None,
            }
        });
        
        // Create a pinned stream
        Ok(Box::pin(stream))
    }

    async fn parse_transaction_notification(&self, notification: Value) -> AppResult<TransactionEvent> {
        Self::parse_transaction_notification_static(notification).await
    }

    async fn parse_transaction_notification_static(notification: Value) -> AppResult<TransactionEvent> {
        // Parse the notification from Solana WebSocket
        if let Some(params) = notification.get("params") {
            if let Some(result) = params.get("result") {
                if let Some(value) = result.get("value") {
                    let signature = value.get("signature")
                        .and_then(|s| s.as_str())
                        .unwrap_or("")
                        .to_string();
                    
                    let slot = value.get("slot")
                        .and_then(|s| s.as_u64())
                        .unwrap_or(0);
                    
                    let err = value.get("err").cloned();
                    
                    let memo = value.get("memo")
                        .and_then(|m| m.as_str())
                        .map(|s| s.to_string());
                    
                    let block_time = value.get("blockTime")
                        .and_then(|t| t.as_i64());
                    
                    let accounts: Vec<String> = value.get("transaction")
                        .and_then(|t| t.get("message"))
                        .and_then(|m| m.get("accountKeys"))
                        .and_then(|a| a.as_array())
                        .map(|arr| arr.iter()
                            .filter_map(|k| k.as_str())
                            .map(|s| s.to_string())
                            .collect())
                        .unwrap_or_default();
                    
                    let program_ids = value.get("transaction")
                        .and_then(|t| t.get("message"))
                        .and_then(|m| m.get("instructions"))
                        .and_then(|i| i.as_array())
                        .map(|arr| arr.iter()
                            .filter_map(|inst| inst.get("programIdIndex"))
                            .filter_map(|idx| idx.as_u64())
                            .filter_map(|idx| accounts.get(idx as usize))
                            .cloned()
                            .collect::<std::collections::HashSet<_>>()
                            .into_iter()
                            .collect())
                        .unwrap_or_default();
                    
                    let instructions = value.get("transaction")
                        .and_then(|t| t.get("message"))
                        .and_then(|m| m.get("instructions"))
                        .and_then(|i| i.as_array())
                        .map(|arr| arr.to_vec())
                        .unwrap_or_default();
                    
                    let meta = value.get("meta").cloned();
                    
                    return Ok(TransactionEvent {
                        signature,
                        slot,
                        err,
                        memo,
                        block_time,
                        accounts,
                        program_ids,
                        instructions,
                        meta,
                    });
                }
            }
        }
        
        Err(crate::error::AppError::Internal("Invalid transaction notification format".to_string()))
    }

    async fn broadcast_transaction_event(&self, transaction: TransactionEvent) -> AppResult<()> {
        let message = WebSocketMessage::TransactionUpdate {
            transaction_id: Uuid::new_v4(), // Generate or extract from transaction
            status: if transaction.err.is_none() { "confirmed".to_string() } else { "failed".to_string() },
            user_id: Uuid::default(), // Extract from transaction if possible
        };
        
        self.websocket_manager.broadcast_message(message).await
    }

    async fn broadcast_token_transaction(&self, transaction: TransactionEvent) -> AppResult<()> {
        // Parse token transaction and broadcast relevant updates
        if let Some(memo) = &transaction.memo {
            if memo.contains("token_created") {
                // Extract token creation data and broadcast
                let message = WebSocketMessage::TokenCreated {
                    token_id: Uuid::new_v4(),
                    name: "New Token".to_string(), // Extract from transaction
                    symbol: "TKN".to_string(), // Extract from transaction
                    creator: transaction.accounts.get(0).unwrap_or(&"unknown".to_string()).clone(),
                };
                
                self.websocket_manager.broadcast_message(message).await?;
            }
        }
        
        Ok(())
    }

    async fn broadcast_account_transaction(websocket_manager: Arc<dyn WebSocketManagerTrait>, transaction: TransactionEvent) -> AppResult<()> {
        // Broadcast account-specific transaction updates
        let message = WebSocketMessage::TransactionUpdate {
            transaction_id: Uuid::new_v4(),
            status: if transaction.err.is_none() { "confirmed".to_string() } else { "failed".to_string() },
            user_id: Uuid::default(),
        };
        
        websocket_manager.broadcast_message(message).await
    }

    async fn get_accounts_to_monitor(&self) -> Vec<String> {
        // TODO: Get accounts from database or configuration
        // For now, return some example accounts
        vec![
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA".to_string(), // SPL Token Program
            self.config.commcoin_program_id.clone(),
        ]
    }
}

// Helper function to start transaction listener
pub async fn start_transaction_listener(
    config: Arc<Config>,
    solana_client: Arc<SolanaClient>,
    websocket_manager: Arc<dyn WebSocketManagerTrait>,
) -> AppResult<()> {
    let listener = TransactionListener::new(config, solana_client, websocket_manager);
    listener.start_listening().await
} 