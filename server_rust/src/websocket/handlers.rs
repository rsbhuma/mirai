use axum::{
    extract::{ws::{Message, WebSocket, WebSocketUpgrade}, State, Query},
    response::IntoResponse,
    Json,
};
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::api::AppState;
use crate::error::AppResult;
use crate::websocket::{WebSocketManager, WebSocketMessage};

#[derive(Debug, Deserialize)]
pub struct WebSocketQuery {
    pub user_id: Option<String>,
    pub token: Option<String>,
    pub subscriptions: Option<String>, // comma-separated list
}

#[derive(Debug, Serialize)]
pub struct ConnectionResponse {
    pub connection_id: String,
    pub status: String,
    pub subscriptions: Vec<String>,
}

pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Query(query): Query<WebSocketQuery>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state, query))
}

async fn handle_socket(socket: WebSocket, state: AppState, query: WebSocketQuery) {
    let connection_id = Uuid::new_v4().to_string();
    
    // Parse user_id if provided
    let user_id = query.user_id
        .and_then(|id| Uuid::parse_str(&id).ok());
    
    // Parse subscriptions
    let subscriptions: Vec<String> = query.subscriptions
        .map(|subs| subs.split(',').map(|s| s.trim().to_string()).collect())
        .unwrap_or_default();
    
    // Add connection to manager
    if let Err(e) = state.websocket_manager.add_connection(connection_id.clone(), user_id).await {
        tracing::error!("Failed to add connection: {}", e);
        return;
    }
    
    // Subscribe to requested topics
    for topic in subscriptions {
        if let Err(e) = state.websocket_manager.subscribe(&connection_id, topic.clone()).await {
            tracing::warn!("Failed to subscribe to topic {}: {}", topic, e);
        }
    }
    
    tracing::info!("WebSocket connection established: {}", connection_id);
    
    // Send welcome message
    let welcome_msg = WebSocketMessage::Notification {
        user_id: user_id.unwrap_or_default(),
        title: "Connected".to_string(),
        message: "Successfully connected to Community Coin WebSocket".to_string(),
        notification_type: "connection".to_string(),
    };
    
    if let Err(e) = state.websocket_manager.send_to_connection(&connection_id, welcome_msg).await {
        tracing::warn!("Failed to send welcome message: {}", e);
    }
    
    // Handle WebSocket messages
    handle_websocket_messages(socket, state, connection_id).await;
}

async fn handle_websocket_messages(mut socket: WebSocket, state: AppState, connection_id: String) {
    let mut message_receiver = state.websocket_manager.get_message_receiver();
    
    loop {
        tokio::select! {
            // Handle incoming messages from client
            msg = socket.recv() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        if let Err(e) = handle_client_message(&state, &connection_id, &text).await {
                            tracing::error!("Error handling client message: {}", e);
                        }
                    }
                    Some(Ok(Message::Close(_))) => {
                        tracing::info!("WebSocket connection closed: {}", connection_id);
                        break;
                    }
                    Some(Ok(Message::Ping(data))) => {
                        if let Err(e) = socket.send(Message::Pong(data)).await {
                            tracing::error!("Failed to send pong: {}", e);
                            break;
                        }
                        // Update ping timestamp
                        if let Err(e) = state.websocket_manager.update_ping(&connection_id).await {
                            tracing::warn!("Failed to update ping: {}", e);
                        }
                    }
                    Some(Err(e)) => {
                        tracing::error!("WebSocket error: {}", e);
                        break;
                    }
                    None => {
                        tracing::info!("WebSocket connection ended: {}", connection_id);
                        break;
                    }
                    _ => {}
                }
            }
            
            // Handle broadcast messages from server
            msg = message_receiver.recv() => {
                match msg {
                    Ok(message) => {
                        if let Err(e) = send_message_to_client(&mut socket, &message).await {
                            tracing::error!("Failed to send message to client: {}", e);
                            break;
                        }
                    }
                    Err(e) => {
                        tracing::error!("Error receiving broadcast message: {}", e);
                        break;
                    }
                }
            }
        }
    }
    
    // Clean up connection
    if let Err(e) = state.websocket_manager.remove_connection(&connection_id).await {
        tracing::error!("Failed to remove connection: {}", e);
    }
}

async fn handle_client_message(state: &AppState, connection_id: &str, text: &str) -> AppResult<()> {
    #[derive(Deserialize)]
    struct ClientMessage {
        #[serde(rename = "type")]
        message_type: String,
        data: Option<serde_json::Value>,
    }
    
    let client_msg: ClientMessage = serde_json::from_str(text)
        .map_err(|e| crate::error::AppError::Internal(format!("Invalid JSON: {}", e)))?;
    
    match client_msg.message_type.as_str() {
        "subscribe" => {
            if let Some(data) = client_msg.data {
                if let Some(topic) = data.get("topic").and_then(|t| t.as_str()) {
                    state.websocket_manager.subscribe(connection_id, topic.to_string()).await?;
                }
            }
        }
        "unsubscribe" => {
            if let Some(data) = client_msg.data {
                if let Some(topic) = data.get("topic").and_then(|t| t.as_str()) {
                    state.websocket_manager.unsubscribe(connection_id, topic).await?;
                }
            }
        }
        "ping" => {
            state.websocket_manager.update_ping(connection_id).await?;
        }
        _ => {
            tracing::warn!("Unknown message type: {}", client_msg.message_type);
        }
    }
    
    Ok(())
}

async fn send_message_to_client(socket: &mut WebSocket, message: &WebSocketMessage) -> AppResult<()> {
    let json = serde_json::to_string(message)
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to serialize message: {}", e)))?;
    
    socket.send(Message::Text(json)).await
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to send message: {}", e)))?;
    
    Ok(())
}

pub async fn get_connections(State(state): State<AppState>) -> AppResult<Json<serde_json::Value>> {
    let stats = state.websocket_manager.get_connection_stats().await;
    Ok(Json(serde_json::json!({
        "total_connections": stats.total_connections,
        "active_users": stats.active_users,
        "subscriptions": stats.subscriptions_count,
        "server_id": state.config.server_id
    })))
}

#[derive(Deserialize)]
pub struct BroadcastRequest {
    pub message_type: String,
    pub data: serde_json::Value,
    pub target: Option<String>, // "all", "user:<id>", "topic:<name>"
}

pub async fn broadcast_message(
    State(state): State<AppState>,
    Json(request): Json<BroadcastRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let message = match request.message_type.as_str() {
        "notification" => {
            let user_id = request.data.get("user_id")
                .and_then(|id| id.as_str())
                .and_then(|id| Uuid::parse_str(id).ok())
                .unwrap_or_default();
            
            let title = request.data.get("title")
                .and_then(|t| t.as_str())
                .unwrap_or("Notification")
                .to_string();
            
            let message_text = request.data.get("message")
                .and_then(|m| m.as_str())
                .unwrap_or("")
                .to_string();
            
            let notification_type = request.data.get("notification_type")
                .and_then(|t| t.as_str())
                .unwrap_or("info")
                .to_string();
            
            WebSocketMessage::Notification {
                user_id,
                title,
                message: message_text,
                notification_type,
            }
        }
        "market_data" => {
            let token_id = request.data.get("token_id")
                .and_then(|id| id.as_str())
                .and_then(|id| Uuid::parse_str(id).ok())
                .unwrap_or_default();
            
            let price = request.data.get("price")
                .and_then(|p| p.as_str())
                .and_then(|p| rust_decimal::Decimal::from_str_exact(p).ok())
                .unwrap_or_default();
            
            let volume_24h = request.data.get("volume_24h")
                .and_then(|v| v.as_str())
                .and_then(|v| rust_decimal::Decimal::from_str_exact(v).ok())
                .unwrap_or_default();
            
            let market_cap = request.data.get("market_cap")
                .and_then(|m| m.as_str())
                .and_then(|m| rust_decimal::Decimal::from_str_exact(m).ok())
                .unwrap_or_default();
            
            WebSocketMessage::MarketData {
                token_id,
                price,
                volume_24h,
                market_cap,
            }
        }
        _ => {
            return Err(crate::error::AppError::BadRequest(
                format!("Unknown message type: {}", request.message_type)
            ));
        }
    };
    
    match request.target.as_deref() {
        Some("all") => {
            state.websocket_manager.broadcast_message(message).await?;
        }
        Some(target) if target.starts_with("user:") => {
            if let Some(user_id_str) = target.strip_prefix("user:") {
                if let Ok(user_id) = Uuid::parse_str(user_id_str) {
                    state.websocket_manager.send_to_user(user_id, message).await?;
                }
            }
        }
        Some(target) if target.starts_with("topic:") => {
            if let Some(topic) = target.strip_prefix("topic:") {
                state.websocket_manager.broadcast_to_subscribers(topic, message).await?;
            }
        }
        _ => {
            state.websocket_manager.broadcast_message(message).await?;
        }
    }
    
    Ok(Json(serde_json::json!({
        "status": "success",
        "message": "Message broadcasted successfully"
    })))
} 