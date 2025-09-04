use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq, Eq, Hash)]
#[sqlx(type_name = "notification_type", rename_all = "lowercase")]
pub enum NotificationType {
    TokenCreated,
    TokenBought,
    TokenSold,
    PriceAlert,
    FollowUser,
    NewFollower,
    TransactionConfirmed,
    TransactionFailed,
    MarketUpdate,
    SystemAlert,
    Achievement,
    Challenge,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "notification_priority", rename_all = "lowercase")]
pub enum NotificationPriority {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Notification {
    pub id: Uuid,
    pub user_id: Uuid,
    pub notification_type: NotificationType,
    pub priority: NotificationPriority,
    pub title: String,
    pub message: String,
    pub data: Option<serde_json::Value>,
    pub is_read: bool,
    pub is_delivered: bool,
    pub delivery_method: Option<String>, // email, push, websocket
    pub scheduled_for: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub read_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateNotificationRequest {
    pub user_id: Uuid,
    pub notification_type: NotificationType,
    pub priority: NotificationPriority,
    pub title: String,
    pub message: String,
    pub data: Option<serde_json::Value>,
    pub delivery_method: Option<String>,
    pub scheduled_for: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationResponse {
    pub id: Uuid,
    pub notification_type: NotificationType,
    pub priority: NotificationPriority,
    pub title: String,
    pub message: String,
    pub data: Option<serde_json::Value>,
    pub is_read: bool,
    pub created_at: DateTime<Utc>,
    pub read_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationSettings {
    pub id: Uuid,
    pub user_id: Uuid,
    pub email_notifications: bool,
    pub push_notifications: bool,
    pub websocket_notifications: bool,
    pub price_alerts: bool,
    pub transaction_updates: bool,
    pub social_updates: bool,
    pub marketing_updates: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateNotificationSettingsRequest {
    pub email_notifications: Option<bool>,
    pub push_notifications: Option<bool>,
    pub websocket_notifications: Option<bool>,
    pub price_alerts: Option<bool>,
    pub transaction_updates: Option<bool>,
    pub social_updates: Option<bool>,
    pub marketing_updates: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PriceAlert {
    pub id: Uuid,
    pub user_id: Uuid,
    pub token_id: Uuid,
    pub alert_type: PriceAlertType,
    pub target_price: rust_decimal::Decimal,
    pub current_price: rust_decimal::Decimal,
    pub is_active: bool,
    pub is_triggered: bool,
    pub triggered_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "price_alert_type", rename_all = "lowercase")]
pub enum PriceAlertType {
    Above,
    Below,
    PercentageIncrease,
    PercentageDecrease,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePriceAlertRequest {
    pub token_id: Uuid,
    pub alert_type: PriceAlertType,
    pub target_price: rust_decimal::Decimal,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationStats {
    pub user_id: Uuid,
    pub total_notifications: i64,
    pub unread_notifications: i64,
    pub notifications_by_type: std::collections::HashMap<NotificationType, i64>,
    pub recent_notifications: Vec<NotificationResponse>,
}

impl From<Notification> for NotificationResponse {
    fn from(notification: Notification) -> Self {
        Self {
            id: notification.id,
            notification_type: notification.notification_type,
            priority: notification.priority,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            is_read: notification.is_read,
            created_at: notification.created_at,
            read_at: notification.read_at,
        }
    }
} 