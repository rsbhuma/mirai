use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use uuid::Uuid;
use serde::{Serialize, Deserialize};
use crate::error::AppResult;
use crate::websocket::connection_manager::{ConnectionManager, ConnectionStats};
use crate::websocket::WebSocketManagerTrait;
use async_trait::async_trait;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WebSocketMessage {
    TokenCreated {
        token_id: Uuid,
        name: String,
        symbol: String,
        creator: String,
    },
    TokenPriceUpdate {
        token_id: Uuid,
        price: rust_decimal::Decimal,
        change_24h: rust_decimal::Decimal,
    },
    TransactionUpdate {
        transaction_id: Uuid,
        status: String,
        user_id: Uuid,
    },
    MarketData {
        token_id: Uuid,
        price: rust_decimal::Decimal,
        volume_24h: rust_decimal::Decimal,
        market_cap: rust_decimal::Decimal,
    },
    Notification {
        user_id: Uuid,
        title: String,
        message: String,
        notification_type: String,
    },
    UserActivity {
        user_id: Uuid,
        activity_type: String,
        data: serde_json::Value,
    },
}

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct WebSocketConnectionData {
    pub user_id: Option<Uuid>,
    pub connection_id: String,
    pub subscriptions: Vec<String>,
    pub last_ping: chrono::DateTime<chrono::Utc>,
    pub server_id: String,
    pub connection_type: String,
}

#[derive(Debug)]
#[allow(dead_code)]
pub struct WebSocketManager {
    connection_manager: Arc<ConnectionManager>,
    message_sender: broadcast::Sender<WebSocketMessage>,
}

// Remove this duplicate ConnectionStats as we'll use the one from connection_manager

#[allow(dead_code)]
impl WebSocketManager {
    pub fn new() -> Self {
        let (message_sender, _) = broadcast::channel(1000);
        let server_id = format!("server-{}", uuid::Uuid::new_v4().to_string()[..8].to_string());
        let connection_manager = Arc::new(ConnectionManager::new(server_id));
        
        Self {
            connection_manager,
            message_sender,
        }
    }

    pub async fn add_connection(&self, connection_id: String, user_id: Option<Uuid>) -> AppResult<()> {
        self.connection_manager.add_connection(connection_id, user_id, None, None).await
    }

    pub async fn remove_connection(&self, connection_id: &str) -> AppResult<()> {
        self.connection_manager.remove_connection(connection_id).await
    }

    pub async fn subscribe(&self, connection_id: &str, topic: String) -> AppResult<()> {
        self.connection_manager.subscribe(connection_id, topic).await
    }

    pub async fn unsubscribe(&self, connection_id: &str, topic: &str) -> AppResult<()> {
        self.connection_manager.unsubscribe(connection_id, topic).await
    }

    pub async fn broadcast_message(&self, message: WebSocketMessage) -> AppResult<()> {
        let _ = self.message_sender.send(message);
        Ok(())
    }

    pub async fn send_to_user(&self, _user_id: Uuid, _message: WebSocketMessage) -> AppResult<()> {
        // TODO: Implement sending message to specific user
        Ok(())
    }

    pub async fn broadcast_to_subscribers(&self, _topic: &str, _message: WebSocketMessage) -> AppResult<()> {
        // TODO: Implement broadcasting to topic subscribers
        Ok(())
    }

    pub async fn get_connection_stats(&self) -> ConnectionStats {
        self.connection_manager.get_connection_stats().await
    }

    pub async fn get_user_connection_count(&self, user_id: Uuid) -> usize {
        self.connection_manager.get_user_connections(user_id).await.len()
    }

    pub async fn update_ping(&self, connection_id: &str) -> AppResult<()> {
        self.connection_manager.update_ping(connection_id).await
    }

    pub fn get_message_receiver(&self) -> broadcast::Receiver<WebSocketMessage> {
        self.message_sender.subscribe()
    }

    pub async fn broadcast_market_data(&self, token_id: Uuid, price: rust_decimal::Decimal, volume_24h: rust_decimal::Decimal, market_cap: rust_decimal::Decimal) -> AppResult<()> {
        let message = WebSocketMessage::MarketData {
            token_id,
            price,
            volume_24h,
            market_cap,
        };
        self.broadcast_message(message).await
    }

    pub async fn broadcast_transaction_update(&self, transaction_id: Uuid, status: String, user_id: Uuid) -> AppResult<()> {
        let message = WebSocketMessage::TransactionUpdate {
            transaction_id,
            status,
            user_id,
        };
        self.broadcast_message(message).await
    }

    pub async fn send_notification(&self, user_id: Uuid, title: String, message: String, notification_type: String) -> AppResult<()> {
        let ws_message = WebSocketMessage::Notification {
            user_id,
            title,
            message,
            notification_type,
        };
        self.send_to_user(user_id, ws_message).await
    }

    pub async fn send_to_connection(&self, _connection_id: &str, message: WebSocketMessage) -> AppResult<()> {
        // TODO: Implement sending message to specific connection
        // For now, just broadcast the message
        self.broadcast_message(message).await
    }
}

#[async_trait]
impl WebSocketManagerTrait for WebSocketManager {
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