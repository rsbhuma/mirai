use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize};
use crate::error::AppResult;
use crate::websocket::WebSocketMessage;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionInfo {
    pub connection_id: String,
    pub user_id: Option<Uuid>,
    pub server_id: String,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub subscriptions: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub last_ping: DateTime<Utc>,
    pub last_activity: DateTime<Utc>,
    pub connection_type: String, // "websocket", "sse", "polling"
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionStats {
    pub total_connections: usize,
    pub active_users: usize,
    pub subscriptions_count: usize,
    pub server_id: String,
    pub connections_by_type: HashMap<String, usize>,
    pub top_subscriptions: Vec<(String, usize)>,
}

#[derive(Debug)]
pub struct ConnectionManager {
    connections: Arc<RwLock<HashMap<String, ConnectionInfo>>>,
    user_connections: Arc<RwLock<HashMap<Uuid, Vec<String>>>>,
    subscription_connections: Arc<RwLock<HashMap<String, Vec<String>>>>,
    message_sender: broadcast::Sender<WebSocketMessage>,
    server_id: String,
    cleanup_interval: tokio::time::Duration,
}

impl ConnectionManager {
    pub fn new(server_id: String) -> Self {
        let (message_sender, _) = broadcast::channel(1000);
        
        Self {
            connections: Arc::new(RwLock::new(HashMap::new())),
            user_connections: Arc::new(RwLock::new(HashMap::new())),
            subscription_connections: Arc::new(RwLock::new(HashMap::new())),
            message_sender,
            server_id,
            cleanup_interval: tokio::time::Duration::from_secs(300), // 5 minutes
        }
    }

    pub async fn add_connection(
        &self,
        connection_id: String,
        user_id: Option<Uuid>,
        ip_address: Option<String>,
        user_agent: Option<String>,
    ) -> AppResult<()> {
        let now = Utc::now();
        let connection_info = ConnectionInfo {
            connection_id: connection_id.clone(),
            user_id,
            server_id: self.server_id.clone(),
            ip_address,
            user_agent,
            subscriptions: Vec::new(),
            created_at: now,
            last_ping: now,
            last_activity: now,
            connection_type: "websocket".to_string(),
            metadata: HashMap::new(),
        };
        
        // Add to main connections map
        let mut connections = self.connections.write().await;
        connections.insert(connection_id.clone(), connection_info);
        
        // Add to user connections map if user_id is provided
        if let Some(user_id) = user_id {
            let mut user_connections = self.user_connections.write().await;
            user_connections.entry(user_id).or_insert_with(Vec::new).push(connection_id.clone());
        }
        
        tracing::info!("Connection added: {} (user: {:?})", connection_id, user_id);
        Ok(())
    }

    pub async fn remove_connection(&self, connection_id: &str) -> AppResult<()> {
        // Get connection info before removing
        let user_id = {
            let connections = self.connections.read().await;
            connections.get(connection_id).and_then(|conn| conn.user_id)
        };
        
        // Remove from main connections map
        let mut connections = self.connections.write().await;
        connections.remove(connection_id);
        
        // Remove from user connections map
        if let Some(user_id) = user_id {
            let mut user_connections = self.user_connections.write().await;
            if let Some(conns) = user_connections.get_mut(&user_id) {
                conns.retain(|id| id != connection_id);
                if conns.is_empty() {
                    user_connections.remove(&user_id);
                }
            }
        }
        
        // Remove from subscription connections map
        let mut subscription_connections = self.subscription_connections.write().await;
        for (_, conns) in subscription_connections.iter_mut() {
            conns.retain(|id| id != connection_id);
        }
        // Clean up empty subscriptions
        subscription_connections.retain(|_, conns| !conns.is_empty());
        
        tracing::info!("Connection removed: {} (user: {:?})", connection_id, user_id);
        Ok(())
    }

    pub async fn subscribe(&self, connection_id: &str, topic: String) -> AppResult<()> {
        // Update connection subscriptions
        let mut connections = self.connections.write().await;
        if let Some(connection) = connections.get_mut(connection_id) {
            if !connection.subscriptions.contains(&topic) {
                connection.subscriptions.push(topic.clone());
                connection.last_activity = Utc::now();
            }
        }
        
        // Add to subscription connections map
        let mut subscription_connections = self.subscription_connections.write().await;
        subscription_connections.entry(topic).or_insert_with(Vec::new).push(connection_id.to_string());
        
        Ok(())
    }

    pub async fn unsubscribe(&self, connection_id: &str, topic: &str) -> AppResult<()> {
        // Update connection subscriptions
        let mut connections = self.connections.write().await;
        if let Some(connection) = connections.get_mut(connection_id) {
            connection.subscriptions.retain(|t| t != topic);
            connection.last_activity = Utc::now();
        }
        
        // Remove from subscription connections map
        let mut subscription_connections = self.subscription_connections.write().await;
        if let Some(conns) = subscription_connections.get_mut(topic) {
            conns.retain(|id| id != connection_id);
        }
        
        Ok(())
    }

    pub async fn update_ping(&self, connection_id: &str) -> AppResult<()> {
        let mut connections = self.connections.write().await;
        if let Some(connection) = connections.get_mut(connection_id) {
            connection.last_ping = Utc::now();
            connection.last_activity = Utc::now();
        }
        Ok(())
    }

    pub async fn update_activity(&self, connection_id: &str) -> AppResult<()> {
        let mut connections = self.connections.write().await;
        if let Some(connection) = connections.get_mut(connection_id) {
            connection.last_activity = Utc::now();
        }
        Ok(())
    }

    pub async fn get_connection_info(&self, connection_id: &str) -> Option<ConnectionInfo> {
        let connections = self.connections.read().await;
        connections.get(connection_id).cloned()
    }

    pub async fn get_user_connections(&self, user_id: Uuid) -> Vec<ConnectionInfo> {
        let user_connections = self.user_connections.read().await;
        let connections = self.connections.read().await;
        
        user_connections
            .get(&user_id)
            .map(|conn_ids| {
                conn_ids
                    .iter()
                    .filter_map(|id| connections.get(id).cloned())
                    .collect()
            })
            .unwrap_or_default()
    }

    pub async fn get_subscription_connections(&self, topic: &str) -> Vec<ConnectionInfo> {
        let subscription_connections = self.subscription_connections.read().await;
        let connections = self.connections.read().await;
        
        subscription_connections
            .get(topic)
            .map(|conn_ids| {
                conn_ids
                    .iter()
                    .filter_map(|id| connections.get(id).cloned())
                    .collect()
            })
            .unwrap_or_default()
    }

    pub async fn get_connection_stats(&self) -> ConnectionStats {
        let connections = self.connections.read().await;
        let subscription_connections = self.subscription_connections.read().await;
        
        let total_connections = connections.len();
        let active_users = connections.values()
            .filter_map(|conn| conn.user_id)
            .collect::<std::collections::HashSet<_>>()
            .len();
        
        let subscriptions_count = connections.values()
            .map(|conn| conn.subscriptions.len())
            .sum();
        
        // Count connections by type
        let mut connections_by_type = HashMap::new();
        for conn in connections.values() {
            *connections_by_type.entry(conn.connection_type.clone()).or_insert(0) += 1;
        }
        
        // Get top subscriptions
        let mut subscription_counts: Vec<(String, usize)> = subscription_connections
            .iter()
            .map(|(topic, conns)| (topic.clone(), conns.len()))
            .collect();
        subscription_counts.sort_by(|a, b| b.1.cmp(&a.1));
        let top_subscriptions = subscription_counts.into_iter().take(10).collect();
        
        ConnectionStats {
            total_connections,
            active_users,
            subscriptions_count,
            server_id: self.server_id.clone(),
            connections_by_type,
            top_subscriptions,
        }
    }

    pub async fn cleanup_stale_connections(&self) -> AppResult<usize> {
        let now = Utc::now();
        let timeout = chrono::Duration::minutes(30); // 30 minutes timeout
        
        let stale_connections: Vec<String> = {
            let connections = self.connections.read().await;
            connections
                .iter()
                .filter(|(_, conn)| now - conn.last_activity > timeout)
                .map(|(id, _)| id.clone())
                .collect()
        };
        
        let mut removed_count = 0;
        for connection_id in stale_connections {
            if let Ok(_) = self.remove_connection(&connection_id).await {
                removed_count += 1;
            }
        }
        
        if removed_count > 0 {
            tracing::info!("Cleaned up {} stale connections", removed_count);
        }
        
        Ok(removed_count)
    }

    pub async fn start_cleanup_task(&self) {
        let manager = self.clone();
        
        tokio::spawn(async move {
            loop {
                tokio::time::sleep(manager.cleanup_interval).await;
                
                if let Err(e) = manager.cleanup_stale_connections().await {
                    tracing::error!("Failed to cleanup stale connections: {}", e);
                }
            }
        });
    }

    pub fn get_message_sender(&self) -> broadcast::Sender<WebSocketMessage> {
        self.message_sender.clone()
    }

    pub fn get_message_receiver(&self) -> broadcast::Receiver<WebSocketMessage> {
        self.message_sender.subscribe()
    }

    pub async fn broadcast_message(&self, message: WebSocketMessage) -> AppResult<()> {
        let _ = self.message_sender.send(message);
        Ok(())
    }

    pub async fn send_to_user(&self, user_id: Uuid, _message: WebSocketMessage) -> AppResult<()> {
        let user_connections = self.get_user_connections(user_id).await;
        
        for connection in user_connections {
            // In a real implementation, you would send the message to the specific connection
            // For now, we'll just log it
            tracing::debug!("Sending message to user {} via connection {}", user_id, connection.connection_id);
        }
        
        Ok(())
    }

    pub async fn broadcast_to_subscribers(&self, topic: &str, _message: WebSocketMessage) -> AppResult<()> {
        let topic_connections = self.get_subscription_connections(topic).await;
        
        for connection in topic_connections {
            // In a real implementation, you would send the message to the specific connection
            // For now, we'll just log it
            tracing::debug!("Sending message to topic {} via connection {}", topic, connection.connection_id);
        }
        
        Ok(())
    }

    pub async fn set_connection_metadata(&self, connection_id: &str, key: String, value: String) -> AppResult<()> {
        let mut connections = self.connections.write().await;
        if let Some(connection) = connections.get_mut(connection_id) {
            connection.metadata.insert(key, value);
            connection.last_activity = Utc::now();
        }
        Ok(())
    }

    pub async fn get_connection_metadata(&self, connection_id: &str, key: &str) -> Option<String> {
        let connections = self.connections.read().await;
        connections.get(connection_id)?.metadata.get(key).cloned()
    }
}

impl Clone for ConnectionManager {
    fn clone(&self) -> Self {
        Self {
            connections: self.connections.clone(),
            user_connections: self.user_connections.clone(),
            subscription_connections: self.subscription_connections.clone(),
            message_sender: self.message_sender.clone(),
            server_id: self.server_id.clone(),
            cleanup_interval: self.cleanup_interval,
        }
    }
} 