use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use crate::error::AppResult;
use crate::websocket::{WebSocketMessage, WebSocketManagerTrait};
use crate::websocket::manager::WebSocketManager;
use crate::websocket::connection_manager::ConnectionStats;
use crate::cache::RedisClient;
use async_trait::async_trait;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrokerMessage {
    pub id: String,
    pub server_id: String,
    pub message_type: String,
    pub payload: WebSocketMessage,
    pub timestamp: i64,
    pub target: Option<String>, // "all", "user:<id>", "topic:<name>", "server:<id>"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerInfo {
    pub server_id: String,
    pub host: String,
    pub port: u16,
    pub connection_count: usize,
    pub last_heartbeat: i64,
}

// Manual Debug implementation since broadcast::Sender doesn't implement Debug
impl std::fmt::Debug for MessageBroker {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("MessageBroker")
            .field("server_id", &self.server_id)
            .field("redis_client", &self.redis_client)
            .finish()
    }
}

pub struct MessageBroker {
    redis_client: Arc<RedisClient>,
    server_id: String,
    local_sender: broadcast::Sender<WebSocketMessage>,
    servers: Arc<RwLock<std::collections::HashMap<String, ServerInfo>>>,
    stop_signal: Arc<tokio::sync::broadcast::Sender<()>>,
}

impl MessageBroker {
    pub fn new(redis_client: Arc<RedisClient>, server_id: String) -> Self {
        let (local_sender, _) = broadcast::channel(1000);
        let (stop_signal, _) = broadcast::channel(1);
        
        Self {
            redis_client,
            server_id,
            local_sender,
            servers: Arc::new(RwLock::new(std::collections::HashMap::new())),
            stop_signal: Arc::new(stop_signal),
        }
    }

    pub async fn start(&self) -> AppResult<()> {
        tracing::info!("Starting message broker for server: {}", self.server_id);
        
        let mut stop_receiver = self.stop_signal.subscribe();
        
        // Start background tasks by cloning data
        let redis_subscriber_task = {
            let redis_client = self.redis_client.clone();
            let local_sender = self.local_sender.clone();
            let server_id = self.server_id.clone();
            async move {
                Self::start_redis_subscriber_static(redis_client, local_sender, server_id).await;
            }
        };
        
        let heartbeat_task = {
            let redis_client = self.redis_client.clone();
            let server_id = self.server_id.clone();
            async move {
                Self::start_heartbeat_sender_static(redis_client, server_id).await;
            }
        };
        
        let discovery_task = {
            let redis_client = self.redis_client.clone();
            let servers = self.servers.clone();
            async move {
                Self::start_server_discovery_static(redis_client, servers).await;
            }
        };
        
        tokio::spawn(redis_subscriber_task);
        tokio::spawn(heartbeat_task);
        tokio::spawn(discovery_task);
        
        tokio::select! {
            _ = async {
                // Keep the main task alive
                loop {
                    tokio::time::sleep(tokio::time::Duration::from_secs(60)).await;
                }
            } => {},
            _ = stop_receiver.recv() => {
                tracing::info!("Message broker stopped");
            }
        }
        
        Ok(())
    }

    pub fn stop(&self) {
        let _ = self.stop_signal.send(());
    }

    pub async fn publish_message(&self, message: WebSocketMessage, target: Option<String>) -> AppResult<()> {
        let broker_message = BrokerMessage {
            id: Uuid::new_v4().to_string(),
            server_id: self.server_id.clone(),
            message_type: self.get_message_type(&message),
            payload: message,
            timestamp: chrono::Utc::now().timestamp(),
            target,
        };
        
        // Publish to Redis for cross-server communication
        let channel = "websocket_messages";
        let message_json = serde_json::to_string(&broker_message)
            .map_err(|e| crate::error::AppError::Internal(format!("Failed to serialize message: {}", e)))?;
        
        self.redis_client.publish(channel, &message_json).await?;
        
        // Also send to local subscribers
        let _ = self.local_sender.send(broker_message.payload);
        
        Ok(())
    }

    pub fn get_local_receiver(&self) -> broadcast::Receiver<WebSocketMessage> {
        self.local_sender.subscribe()
    }

    pub async fn get_server_list(&self) -> Vec<ServerInfo> {
        let servers = self.servers.read().await;
        servers.values().cloned().collect()
    }

    pub async fn get_server_info(&self, server_id: &str) -> Option<ServerInfo> {
        let servers = self.servers.read().await;
        servers.get(server_id).cloned()
    }

    async fn start_redis_subscriber_static(
        _redis_client: Arc<RedisClient>,
        _local_sender: broadcast::Sender<WebSocketMessage>,
        server_id: String,
    ) {
        // For now, just log that we would subscribe to Redis
        // TODO: Implement proper Redis pubsub when Redis client supports it
        tracing::info!("Redis subscriber would start for server: {}", server_id);
        
        // Keep the task alive
        loop {
            tokio::time::sleep(tokio::time::Duration::from_secs(30)).await;
        }
    }

    async fn start_heartbeat_sender_static(
        redis_client: Arc<RedisClient>,
        server_id: String,
    ) {
        let heartbeat_key = format!("server_heartbeat:{}", server_id);
        
        loop {
            let heartbeat = serde_json::json!({
                "server_id": server_id,
                "timestamp": chrono::Utc::now().timestamp(),
                "status": "alive"
            });
            
            if let Ok(heartbeat_json) = serde_json::to_string(&heartbeat) {
                // Use set_simple instead of set_ex for now
                let _ = redis_client.set_simple(&heartbeat_key, &heartbeat_json).await;
            }
            
            tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
        }
    }

    async fn start_server_discovery_static(
        _redis_client: Arc<RedisClient>,
        servers: Arc<RwLock<std::collections::HashMap<String, ServerInfo>>>,
    ) {
        loop {
            // For now, just log that we would discover servers
            // TODO: Implement proper server discovery when Redis client supports keys() method
            tracing::debug!("Would discover servers from Redis");
            
            // Clean up stale servers (no heartbeat for more than 60 seconds)
            let now = chrono::Utc::now().timestamp();
            let mut servers_write = servers.write().await;
            servers_write.retain(|_, server| now - server.last_heartbeat < 60);
            
            tokio::time::sleep(tokio::time::Duration::from_secs(30)).await;
        }
    }

    fn get_message_type(&self, message: &WebSocketMessage) -> String {
        match message {
            WebSocketMessage::TokenCreated { .. } => "token_created".to_string(),
            WebSocketMessage::TokenPriceUpdate { .. } => "token_price_update".to_string(),
            WebSocketMessage::TransactionUpdate { .. } => "transaction_update".to_string(),
            WebSocketMessage::MarketData { .. } => "market_data".to_string(),
            WebSocketMessage::Notification { .. } => "notification".to_string(),
            WebSocketMessage::UserActivity { .. } => "user_activity".to_string(),
        }
    }
}

// Enhanced WebSocket Manager that uses the message broker
#[derive(Debug)]
pub struct ScalableWebSocketManager {
    local_manager: WebSocketManager,
    message_broker: Arc<MessageBroker>,
}

impl ScalableWebSocketManager {
    pub fn new(local_manager: WebSocketManager, message_broker: Arc<MessageBroker>) -> Self {
        Self {
            local_manager,
            message_broker,
        }
    }

    pub async fn broadcast_message(&self, message: WebSocketMessage) -> AppResult<()> {
        // Send to all servers via message broker
        self.message_broker.publish_message(message, Some("all".to_string())).await
    }

    pub async fn send_to_user(&self, user_id: Uuid, message: WebSocketMessage) -> AppResult<()> {
        // Try local first, then broadcast to all servers
        if let Err(_) = self.local_manager.send_to_user(user_id, message.clone()).await {
            self.message_broker.publish_message(message, Some(format!("user:{}", user_id))).await?;
        }
        Ok(())
    }

    pub async fn broadcast_to_subscribers(&self, topic: &str, message: WebSocketMessage) -> AppResult<()> {
        // Try local first, then broadcast to all servers
        if let Err(_) = self.local_manager.broadcast_to_subscribers(topic, message.clone()).await {
            self.message_broker.publish_message(message, Some(format!("topic:{}", topic))).await?;
        }
        Ok(())
    }

    pub async fn add_connection(&self, connection_id: String, user_id: Option<Uuid>) -> AppResult<()> {
        self.local_manager.add_connection(connection_id, user_id).await
    }

    pub async fn remove_connection(&self, connection_id: &str) -> AppResult<()> {
        self.local_manager.remove_connection(connection_id).await
    }

    pub async fn subscribe(&self, connection_id: &str, topic: String) -> AppResult<()> {
        self.local_manager.subscribe(connection_id, topic).await
    }

    pub async fn unsubscribe(&self, connection_id: &str, topic: &str) -> AppResult<()> {
        self.local_manager.unsubscribe(connection_id, topic).await
    }

    pub async fn get_connection_stats(&self) -> crate::websocket::ConnectionStats {
        self.local_manager.get_connection_stats().await
    }

    pub async fn get_user_connection_count(&self, user_id: Uuid) -> usize {
        self.local_manager.get_user_connection_count(user_id).await
    }

    pub async fn update_ping(&self, connection_id: &str) -> AppResult<()> {
        self.local_manager.update_ping(connection_id).await
    }

    pub fn get_message_receiver(&self) -> broadcast::Receiver<WebSocketMessage> {
        self.local_manager.get_message_receiver()
    }

    pub async fn send_to_connection(&self, connection_id: &str, message: WebSocketMessage) -> AppResult<()> {
        self.local_manager.send_to_connection(connection_id, message).await
    }
}

#[async_trait]
impl WebSocketManagerTrait for ScalableWebSocketManager {
    async fn add_connection(&self, connection_id: String, user_id: Option<Uuid>) -> AppResult<()> {
        self.add_connection(connection_id, user_id).await
    }

    async fn remove_connection(&self, connection_id: &str) -> AppResult<()> {
        self.remove_connection(connection_id).await
    }

    async fn subscribe(&self, connection_id: &str, topic: String) -> AppResult<()> {
        self.subscribe(connection_id, topic).await
    }

    async fn unsubscribe(&self, connection_id: &str, topic: &str) -> AppResult<()> {
        self.unsubscribe(connection_id, topic).await
    }

    async fn broadcast_message(&self, message: WebSocketMessage) -> AppResult<()> {
        self.broadcast_message(message).await
    }

    async fn send_to_user(&self, user_id: Uuid, message: WebSocketMessage) -> AppResult<()> {
        self.send_to_user(user_id, message).await
    }

    async fn broadcast_to_subscribers(&self, topic: &str, message: WebSocketMessage) -> AppResult<()> {
        self.broadcast_to_subscribers(topic, message).await
    }

    async fn get_connection_stats(&self) -> ConnectionStats {
        self.get_connection_stats().await
    }

    async fn get_user_connection_count(&self, user_id: Uuid) -> usize {
        self.get_user_connection_count(user_id).await
    }

    async fn update_ping(&self, connection_id: &str) -> AppResult<()> {
        self.update_ping(connection_id).await
    }

    fn get_message_receiver(&self) -> broadcast::Receiver<WebSocketMessage> {
        self.get_message_receiver()
    }

    async fn send_to_connection(&self, connection_id: &str, message: WebSocketMessage) -> AppResult<()> {
        self.send_to_connection(connection_id, message).await
    }
} 