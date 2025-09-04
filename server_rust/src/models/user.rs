use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use validator::Validate;
use rust_decimal::Decimal;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub wallet_address: String,
    pub username: Option<String>,
    pub display_name: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub email: Option<String>,
    pub is_active: bool,
    pub is_verified: bool,
    pub total_tokens_created: i32,
    pub total_volume_traded: Decimal,
    pub reputation_score: i32,
    pub follower_count: i32,
    pub following_count: i32,
    pub last_active_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(length(min = 32, max = 44))]
    pub wallet_address: String,
    #[validate(length(min = 3, max = 50))]
    pub username: Option<String>,
    #[validate(length(max = 100))]
    pub display_name: Option<String>,
    #[validate(length(max = 500))]
    pub bio: Option<String>,
    #[validate(url)]
    pub avatar_url: Option<String>,
    #[validate(email)]
    pub email: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct UpdateUserRequest {
    #[validate(length(min = 3, max = 50))]
    pub username: Option<String>,
    #[validate(length(max = 100))]
    pub display_name: Option<String>,
    #[validate(length(max = 500))]
    pub bio: Option<String>,
    #[validate(url)]
    pub avatar_url: Option<String>,
    #[validate(email)]
    pub email: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub wallet_address: String,
    pub username: Option<String>,
    pub display_name: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub is_verified: bool,
    pub total_tokens_created: i32,
    pub total_volume_traded: Decimal,
    pub reputation_score: i32,
    pub follower_count: i32,
    pub following_count: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfile {
    pub user: UserResponse,
    pub tokens_created: Vec<crate::models::TokenResponse>,
    pub recent_transactions: Vec<crate::models::TransactionResponse>,
    pub is_following: bool,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct UserFollow {
    pub id: Uuid,
    pub follower_id: Uuid,
    pub following_id: Uuid,
    pub created_at: DateTime<Utc>,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            wallet_address: user.wallet_address,
            username: user.username,
            display_name: user.display_name,
            bio: user.bio,
            avatar_url: user.avatar_url,
            is_verified: user.is_verified,
            total_tokens_created: user.total_tokens_created,
            total_volume_traded: user.total_volume_traded,
            reputation_score: user.reputation_score,
            follower_count: user.follower_count,
            following_count: user.following_count,
            created_at: user.created_at,
        }
    }
} 