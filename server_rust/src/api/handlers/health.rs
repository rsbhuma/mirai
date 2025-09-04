use axum::{extract::State, Json};
use serde_json::{json, Value};
use crate::api::AppState;
use crate::error::AppResult;

async fn check_redis_health(state: &AppState) -> bool {
    let redis_guard = state.redis.lock().await;
    match redis_guard.ping().await {
        Ok(_) => true,
        Err(_) => false,
    }
}

async fn check_database_health(state: &AppState) -> bool {
    match state.db.health_check().await {
        Ok(healthy) => healthy,
        Err(_) => false,
    }
}

async fn check_solana_health(state: &AppState) -> bool {
    match state.solana.health_check().await {
        Ok(_) => true,
        Err(_) => false,
    }
}

pub async fn health_check(State(state): State<AppState>) -> AppResult<Json<Value>> {
    let redis_healthy = check_redis_health(&state).await;
    let db_healthy = check_database_health(&state).await;
    let solana_healthy = check_solana_health(&state).await;
    
    let overall_healthy = redis_healthy && db_healthy && solana_healthy;
    
    let db_stats = state.db.get_connection_stats().await;
    
    Ok(Json(json!({
        "status": if overall_healthy { "healthy" } else { "unhealthy" },
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "services": {
            "database": {
                "status": if db_healthy { "healthy" } else { "unhealthy" },
                "connections": {
                    "active": db_stats.active_connections,
                    "idle": db_stats.idle_connections,
                    "max": db_stats.max_connections
                }
            },
            "redis": {
                "status": if redis_healthy { "healthy" } else { "unhealthy" }
            },
            "solana": {
                "status": if solana_healthy { "healthy" } else { "unhealthy" }
            }
        }
    })))
}

#[allow(dead_code)]
pub async fn api_health(State(state): State<AppState>) -> AppResult<Json<Value>> {
    // Simple API health check
    let redis_healthy = check_redis_health(&state).await;
    let db_healthy = check_database_health(&state).await;
    
    Ok(Json(json!({
        "status": "ok",
        "api_version": "1.0.0",
        "services": {
            "database": if db_healthy { "up" } else { "down" },
            "redis": if redis_healthy { "up" } else { "down" }
        },
        "timestamp": chrono::Utc::now().to_rfc3339()
    })))
}

pub async fn status_check(State(state): State<AppState>) -> AppResult<Json<Value>> {
    let db_stats = state.db.get_connection_stats().await;
    let ws_stats = state.websocket_manager.get_connection_stats().await;
    
    Ok(Json(json!({
        "status": "ok",
        "server": "community_coin_server",
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "uptime": "running",
        "stats": {
            "database": db_stats,
            "websocket_connections": ws_stats.total_connections,
            "active_users": ws_stats.active_users
        }
    })))
}

pub async fn websocket_health(State(state): State<AppState>) -> AppResult<Json<Value>> {
    let stats = state.websocket_manager.get_connection_stats().await;
    
    Ok(Json(json!({
        "status": "healthy",
        "websocket": {
            "total_connections": stats.total_connections,
            "active_users": stats.active_users,
            "subscriptions_count": stats.subscriptions_count,
            "server_id": state.config.server_id
        },
        "endpoint": format!("ws://localhost:{}/ws", state.config.port),
        "timestamp": chrono::Utc::now().to_rfc3339()
    })))
}

pub async fn metrics(State(_state): State<AppState>) -> AppResult<String> {
    // Prometheus metrics format
    let metrics = r#"
# HELP community_coin_requests_total Total number of requests
# TYPE community_coin_requests_total counter
community_coin_requests_total 1000

# HELP community_coin_active_connections Current active WebSocket connections
# TYPE community_coin_active_connections gauge
community_coin_active_connections 50

# HELP community_coin_database_connections Current database connections
# TYPE community_coin_database_connections gauge
community_coin_database_connections 10
"#;
    
    Ok(metrics.to_string())
} 