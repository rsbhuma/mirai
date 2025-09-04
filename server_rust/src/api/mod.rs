pub mod routes;
pub mod handlers;
pub mod middleware;
pub mod auth_utils;

use std::sync::Arc;
use tokio::sync::Mutex;
use crate::database::DatabaseManager;
use crate::cache::RedisClient;
use crate::blockchain::SolanaClient;
use crate::websocket::{WebSocketManager, ScalableWebSocketManager, WebSocketManagerTrait};
use crate::config::Config;

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<DatabaseManager>,
    pub redis: Arc<Mutex<RedisClient>>,
    pub solana: Arc<SolanaClient>,
    pub websocket_manager: Arc<dyn WebSocketManagerTrait>,
    pub config: Arc<Config>,
}

impl AppState {
    pub fn new(
        db: DatabaseManager,
        redis: RedisClient,
        solana: SolanaClient,
        websocket_manager: Arc<dyn WebSocketManagerTrait>,
        config: Config,
    ) -> Self {
        Self {
            db: Arc::new(db),
            redis: Arc::new(Mutex::new(redis)),
            solana: Arc::new(solana),
            websocket_manager,
            config: Arc::new(config),
        }
    }
} 