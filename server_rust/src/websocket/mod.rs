pub mod manager;
pub mod handlers;
pub mod transaction_listener;
pub mod message_broker;
pub mod connection_manager;

pub use manager::*;
pub use transaction_listener::*;
pub use message_broker::*;
pub use connection_manager::*;

use std::sync::Arc;
use tokio::sync::broadcast;
use uuid::Uuid;
use crate::error::AppResult;
use crate::websocket::WebSocketMessage;
use crate::websocket::connection_manager::ConnectionStats;

#[async_trait::async_trait]
pub trait WebSocketManagerTrait: Send + Sync {
    async fn add_connection(&self, connection_id: String, user_id: Option<Uuid>) -> AppResult<()>;
    async fn remove_connection(&self, connection_id: &str) -> AppResult<()>;
    async fn subscribe(&self, connection_id: &str, topic: String) -> AppResult<()>;
    async fn unsubscribe(&self, connection_id: &str, topic: &str) -> AppResult<()>;
    async fn broadcast_message(&self, message: WebSocketMessage) -> AppResult<()>;
    async fn send_to_user(&self, user_id: Uuid, message: WebSocketMessage) -> AppResult<()>;
    async fn broadcast_to_subscribers(&self, topic: &str, message: WebSocketMessage) -> AppResult<()>;
    async fn get_connection_stats(&self) -> ConnectionStats;
    async fn get_user_connection_count(&self, user_id: Uuid) -> usize;
    async fn update_ping(&self, connection_id: &str) -> AppResult<()>;
    fn get_message_receiver(&self) -> broadcast::Receiver<WebSocketMessage>;
    async fn send_to_connection(&self, connection_id: &str, message: WebSocketMessage) -> AppResult<()>;
} 