use std::env;
use crate::error::AppError;

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct Config {
    pub port: u16,
    pub database_url: String,
    pub database_read_urls: Option<Vec<String>>,
    pub redis_url: String,
    pub solana_rpc_url: String,
    pub solana_ws_url: String,
    pub helius_api_key: Option<String>,
    pub jwt_secret: String,
    pub jwt_expiry_hours: i64,
    pub commcoin_program_id: String,
    pub environment: String,
    pub log_level: String,
    pub server_id: String,
    pub websocket_max_connections: usize,
    pub websocket_heartbeat_interval: u64,
    pub transaction_listener_enabled: bool,
    pub message_broker_enabled: bool,
}

impl Config {
    pub fn from_env() -> Result<Self, AppError> {
        let helius_api_key = env::var("HELIUS_API_KEY").ok();
        
        // Determine RPC URL priority: Helius > Custom > Local
        let solana_rpc_url = if let Some(ref api_key) = helius_api_key {
            format!("https://mainnet.helius-rpc.com/v0/{}", api_key)
        } else {
            env::var("SOLANA_RPC_URL")
                .unwrap_or_else(|_| "http://localhost:8899".to_string())
        };
        
        let solana_ws_url = if helius_api_key.is_some() {
            "wss://mainnet.helius-rpc.com/v0/websocket".to_string()
        } else {
            env::var("SOLANA_WS_URL")
                .unwrap_or_else(|_| "ws://localhost:8900".to_string())
        };
        
        Ok(Self {
            port: env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .map_err(|e| AppError::Config(format!("Invalid PORT: {}", e)))?,
            
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgresql://postgres:password@localhost:5433/community_coin_db".to_string()),
            
            database_read_urls: env::var("DATABASE_READ_URLS")
                .ok()
                .map(|urls| urls.split(',').map(|s| s.trim().to_string()).collect()),

            redis_url: env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6380".to_string()),
            
            solana_rpc_url,
            solana_ws_url,
            helius_api_key,
            
            jwt_secret: env::var("JWT_SECRET")
                .unwrap_or_else(|_| "your-secret-key-change-in-production".to_string()),
            
            jwt_expiry_hours: env::var("JWT_EXPIRY_HOURS")
                .unwrap_or_else(|_| "24".to_string())
                .parse()
                .unwrap_or(24),

            commcoin_program_id: env::var("COMMCOIN_PROGRAM_ID")
                .unwrap_or_else(|_| "6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX".to_string()),

            environment: env::var("ENVIRONMENT")
                .unwrap_or_else(|_| "development".to_string()),

            log_level: env::var("LOG_LEVEL")
                .unwrap_or_else(|_| "info".to_string()),
                
            server_id: env::var("SERVER_ID")
                .unwrap_or_else(|_| format!("server-{}", uuid::Uuid::new_v4().to_string()[..8].to_string())),
                
            websocket_max_connections: env::var("WEBSOCKET_MAX_CONNECTIONS")
                .unwrap_or_else(|_| "10000".to_string())
                .parse()
                .unwrap_or(10000),
                
            websocket_heartbeat_interval: env::var("WEBSOCKET_HEARTBEAT_INTERVAL")
                .unwrap_or_else(|_| "30".to_string())
                .parse()
                .unwrap_or(30),
                
            transaction_listener_enabled: env::var("TRANSACTION_LISTENER_ENABLED")
                .unwrap_or_else(|_| "true".to_string())
                .parse()
                .unwrap_or(true),
                
            message_broker_enabled: env::var("MESSAGE_BROKER_ENABLED")
                .unwrap_or_else(|_| "true".to_string())
                .parse()
                .unwrap_or(true),
        })
    }
    
    pub fn get_rpc_provider(&self) -> &str {
        if self.helius_api_key.is_some() {
            "Helius API"
        } else if self.solana_rpc_url.contains("localhost") {
            "Local Validator"
        } else {
            "Custom RPC"
        }
    }
} 