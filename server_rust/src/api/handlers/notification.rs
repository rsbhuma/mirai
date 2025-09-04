use axum::{extract::{Path, State}, Json};
use uuid::Uuid;
use crate::api::AppState;
use crate::models::*;
use crate::error::AppResult;

pub async fn list_notifications(State(_state): State<AppState>) -> AppResult<Json<Vec<NotificationResponse>>> {
    Ok(Json(vec![]))
}

pub async fn get_notification(State(_state): State<AppState>, Path(_id): Path<Uuid>) -> AppResult<Json<NotificationResponse>> {
    Err(crate::error::AppError::NotFound("Notification not found".to_string()))
}

pub async fn mark_as_read(State(_state): State<AppState>, Path(id): Path<Uuid>) -> AppResult<Json<serde_json::Value>> {
    Ok(Json(serde_json::json!({"message": "Notification marked as read", "id": id})))
}

pub async fn get_unread_notifications(State(_state): State<AppState>) -> AppResult<Json<Vec<NotificationResponse>>> {
    Ok(Json(vec![]))
}

pub async fn get_notification_settings(State(_state): State<AppState>) -> AppResult<Json<NotificationSettings>> {
    Err(crate::error::AppError::NotFound("Settings not found".to_string()))
}

pub async fn update_notification_settings(State(_state): State<AppState>, Json(_request): Json<UpdateNotificationSettingsRequest>) -> AppResult<Json<NotificationSettings>> {
    Err(crate::error::AppError::NotImplemented("Settings update not implemented".to_string()))
}

pub async fn get_price_alerts(State(_state): State<AppState>) -> AppResult<Json<Vec<PriceAlert>>> {
    Ok(Json(vec![]))
}

pub async fn create_price_alert(State(_state): State<AppState>, Json(_request): Json<CreatePriceAlertRequest>) -> AppResult<Json<PriceAlert>> {
    Err(crate::error::AppError::NotImplemented("Price alert creation not implemented".to_string()))
}

pub async fn delete_price_alert(State(_state): State<AppState>, Path(id): Path<Uuid>) -> AppResult<Json<serde_json::Value>> {
    Ok(Json(serde_json::json!({"message": "Price alert deleted", "id": id})))
} 