use std::sync::Arc;
use tower_http::cors::CorsLayer;
use axum::http::{HeaderValue, HeaderName, Method};
use tracing::{info, warn, error};

mod models;
mod database;
mod cache;
mod blockchain;
mod websocket;
mod api;
mod config;
mod error;

use config::Config;
use database::DatabaseManager;
use cache::RedisClient;
use blockchain::SolanaClient;
use websocket::{WebSocketManager, TransactionListener, MessageBroker, ScalableWebSocketManager};
use api::{routes::create_routes, AppState};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    info!("🚀 Starting Community Coin Server...");

    // Load configuration
    info!("📋 Loading configuration...");
    let config = Config::from_env().map_err(|e| {
        error!("Failed to load configuration: {}", e);
        e
    })?;
    info!("✅ Configuration loaded successfully");

    // Initialize database
    info!("🗄️ Initializing database connection...");
    info!("📊 Database URL: {}", config.database_url);
    if let Some(ref read_urls) = config.database_read_urls {
        if !read_urls.is_empty() {
            info!("📖 Read replicas: {} configured", read_urls.len());
        }
    }
    
    info!("🔗 Attempting to connect to database...");
    let db = match DatabaseManager::new(&config.database_url, config.database_read_urls.clone()).await {
        Ok(db) => {
            info!("✅ Database manager created successfully");
            db
        },
        Err(e) => {
            error!("❌ Failed to create database manager: {}", e);
            error!("💡 Please check your DATABASE_URL and ensure PostgreSQL is running");
            return Err(Box::new(e) as Box<dyn std::error::Error>);
        }
    };
    match db.health_check().await {
        Ok(true) => {
            info!("✅ Database connected successfully");
            info!("🗄️ PostgreSQL Status: HEALTHY");
        },
        Ok(false) => {
            warn!("⚠️ Database health check failed");
            info!("🗄️ PostgreSQL Status: UNHEALTHY");
        },
        Err(e) => {
            warn!("⚠️ Database connection failed: {}", e);
            info!("🗄️ PostgreSQL Status: CONNECTION_FAILED");
        },
    }

    // Initialize Redis client (optional for startup)
    info!("🔴 Initializing Redis client...");
    info!("🔗 Redis URL: {}", config.redis_url);
    
    let redis = match RedisClient::new(&config.redis_url).await {
        Ok(redis) => {
            info!("✅ Redis connected successfully");
            // Test Redis ping
            match redis.ping().await {
                Ok(_) => {
                    info!("🔴 Redis Status: HEALTHY");
                    info!("🔴 Redis Ping: SUCCESS");
                },
                Err(e) => {
                    warn!("⚠️ Redis ping failed: {}", e);
                    info!("🔴 Redis Status: PING_FAILED");
                }
            }
            redis
        }
        Err(e) => {
            warn!("⚠️ Redis connection failed: {}", e);
            warn!("🔄 Server will start without Redis caching");
            info!("🔴 Redis Status: CONNECTION_FAILED");
            // Create a mock Redis client for development
            RedisClient::new("redis://dummy:6379").await.unwrap_or_else(|_| {
                panic!("Failed to create Redis client")
            })
        }
    };

    // Initialize Solana client
    info!("⛓️ Initializing Solana client...");
    info!("🔗 Using RPC Provider: {}", config.get_rpc_provider());
    info!("🌐 RPC URL: {}", config.solana_rpc_url);
    info!("🌐 WebSocket URL: {}", config.solana_ws_url);
    info!("🎯 Program ID: {}", config.commcoin_program_id);
    
    let solana = SolanaClient::new(&config);
    match solana.health_check().await {
        Ok(_) => {
            info!("✅ Solana client connected successfully");
            info!("⛓️ Solana Status: HEALTHY");
            info!("⛓️ Solana Network: {}", config.get_rpc_provider());
        },
        Err(e) => {
            warn!("⚠️ Solana connection failed: {}", e);
            info!("⛓️ Solana Status: CONNECTION_FAILED");
        },
    }

    // Initialize WebSocket manager
    info!("🔌 Initializing WebSocket manager...");
    info!("🆔 Server ID: {}", config.server_id);
    info!("🔗 WebSocket Endpoint: ws://0.0.0.0:{}/ws", config.port);
    
    let websocket_manager = WebSocketManager::new();
    
    // Initialize message broker if enabled
    let websocket_manager = if config.message_broker_enabled {
        info!("🔄 Initializing message broker...");
        let message_broker = Arc::new(MessageBroker::new(Arc::new(redis.clone()), config.server_id.clone()));
        
        // Start message broker in background
        let broker_clone = message_broker.clone();
        tokio::spawn(async move {
            if let Err(e) = broker_clone.start().await {
                error!("Message broker failed to start: {}", e);
            }
        });
        
        let scalable_manager = ScalableWebSocketManager::new(WebSocketManager::new(), message_broker);
        info!("✅ Scalable WebSocket manager initialized");
        info!("🔌 WebSocket Status: SCALABLE_MODE");
        Arc::new(scalable_manager) as Arc<dyn websocket::WebSocketManagerTrait>
    } else {
        info!("✅ Basic WebSocket manager initialized");
        info!("🔌 WebSocket Status: BASIC_MODE");
        Arc::new(websocket_manager) as Arc<dyn websocket::WebSocketManagerTrait>
    };
    
    // Initialize transaction listener if enabled
    if config.transaction_listener_enabled {
        info!("📡 Initializing transaction listener...");
        info!("🎯 Monitoring Program: {}", config.commcoin_program_id);
        info!("🪙 Token Program: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
        info!("📊 Transaction Types: Program, Token, Account");
        
        let transaction_listener = TransactionListener::new(
            Arc::new(config.clone()),
            Arc::new(solana.clone()),
            websocket_manager.clone(),
        );
        
        // Start transaction listener in background
        tokio::spawn(async move {
            if let Err(e) = transaction_listener.start_listening().await {
                error!("Transaction listener failed: {}", e);
            }
        });
        info!("✅ Transaction listener started");
        info!("📡 Transaction Listener Status: ACTIVE");
        info!("📡 Listening for Solana transactions...");
    } else {
        info!("📡 Transaction Listener Status: DISABLED");
    }

    // Perform final health checks before creating AppState
    let db_healthy = db.health_check().await.unwrap_or(false);
    let redis_healthy = redis.ping().await.is_ok();
    let solana_healthy = solana.health_check().await.is_ok();
    
    // Print comprehensive status summary
    info!("");
    info!("🎉 =========================================");
    info!("🎉 COMMUNITY COIN SERVER STARTUP COMPLETE");
    info!("🎉 =========================================");
    info!("");
    info!("📊 SERVER STATUS SUMMARY:");
    info!("   🆔 Server ID: {}", config.server_id);
    info!("   🌐 Port: {}", config.port);
    info!("   🗄️ PostgreSQL: {}", if db_healthy { "✅ HEALTHY" } else { "❌ UNHEALTHY" });
    info!("   🔴 Redis: {}", if redis_healthy { "✅ HEALTHY" } else { "❌ UNHEALTHY" });
    info!("   ⛓️ Solana: {}", if solana_healthy { "✅ HEALTHY" } else { "❌ UNHEALTHY" });
    info!("   🔌 WebSocket: {}", if config.message_broker_enabled { "✅ SCALABLE_MODE" } else { "✅ BASIC_MODE" });
    info!("   📡 Transaction Listener: {}", if config.transaction_listener_enabled { "✅ ACTIVE" } else { "❌ DISABLED" });
    info!("");
    info!("🔗 SERVICE ENDPOINTS:");
    info!("   🚀 Server: http://0.0.0.0:{}", config.port);
    info!("   📊 Health: http://0.0.0.0:{}/health", config.port);
    info!("   🔍 API Health: http://0.0.0.0:{}/api/health", config.port);
    info!("   📈 Metrics: http://0.0.0.0:{}/metrics", config.port);
    info!("   🔌 WebSocket: ws://0.0.0.0:{}/ws", config.port);
    info!("");
    info!("🎯 MONITORING TARGETS:");
    info!("   🎯 Program ID: {}", config.commcoin_program_id);
    info!("   🪙 Token Program: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
    info!("   📊 Transaction Types: Program, Token, Account");
    info!("");
    info!("🚀 Starting HTTP server...");

    // Create application state
    let app_state = AppState::new(db, redis, solana, websocket_manager, config.clone());

    // Create router with all routes
    info!("🛣️ Setting up API routes...");
    let app = create_routes()
        .layer(
            CorsLayer::new()
                .allow_origin(HeaderValue::from_static("http://localhost:5173"))
                .allow_methods([
                    Method::GET,
                    Method::POST,
                    Method::PUT,
                    Method::DELETE,
                    Method::OPTIONS,
                ])
                .allow_headers([
                    HeaderName::from_static("content-type"),
                    HeaderName::from_static("authorization"),
                    HeaderName::from_static("accept"),
                    HeaderName::from_static("origin"),
                    HeaderName::from_static("x-requested-with"),
                    HeaderName::from_static("sec-websocket-key"),
                    HeaderName::from_static("sec-websocket-version"),
                    HeaderName::from_static("sec-websocket-protocol"),
                ])
                .allow_credentials(true)
        )
        .with_state(app_state);

    // Create the listener
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", config.port)).await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;

    // Start the server
    axum::serve(listener, app).await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;

    Ok(())
} 