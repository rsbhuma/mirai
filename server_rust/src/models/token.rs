use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use validator::Validate;
use rust_decimal::Decimal;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Token {
    pub id: Uuid,
    pub mint_address: String,
    pub creator_id: Uuid,
    pub creator_pubkey: String,
    pub name: String,
    pub symbol: String,
    pub description: Option<String>,
    pub icon_url: Option<String>,
    pub website_url: Option<String>,
    pub twitter_url: Option<String>,
    pub telegram_url: Option<String>,
    pub total_supply: Decimal,
    pub current_supply: Decimal,
    pub market_cap: Decimal,
    pub current_price: Decimal,
    pub price_change_24h: Decimal,
    pub volume_24h: Decimal,
    pub holder_count: i32,
    pub transaction_count: i32,
    pub is_active: bool,
    pub is_verified: bool,
    pub bonding_curve_complete: bool,
    pub graduation_threshold: Decimal,
    pub tx_signature: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CreateTokenRequest {
    #[validate(length(min = 1, max = 50))]
    pub name: String,
    #[validate(length(min = 1, max = 10))]
    pub symbol: String,
    #[validate(length(max = 1000))]
    pub description: Option<String>,
    #[validate(url)]
    pub icon_url: Option<String>,
    #[validate(url)]
    pub website_url: Option<String>,
    #[validate(url)]
    pub twitter_url: Option<String>,
    #[validate(url)]
    pub telegram_url: Option<String>,
    pub total_supply: Decimal,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct UpdateTokenRequest {
    #[validate(length(max = 1000))]
    pub description: Option<String>,
    #[validate(url)]
    pub icon_url: Option<String>,
    #[validate(url)]
    pub website_url: Option<String>,
    #[validate(url)]
    pub twitter_url: Option<String>,
    #[validate(url)]
    pub telegram_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenResponse {
    pub id: Uuid,
    pub mint_address: String,
    pub creator_id: Uuid,
    pub creator_pubkey: String,
    pub name: String,
    pub symbol: String,
    pub description: Option<String>,
    pub icon_url: Option<String>,
    pub website_url: Option<String>,
    pub twitter_url: Option<String>,
    pub telegram_url: Option<String>,
    pub total_supply: Decimal,
    pub current_supply: Decimal,
    pub market_cap: Decimal,
    pub current_price: Decimal,
    pub price_change_24h: Decimal,
    pub volume_24h: Decimal,
    pub holder_count: i32,
    pub transaction_count: i32,
    pub is_verified: bool,
    pub bonding_curve_complete: bool,
    pub graduation_threshold: Decimal,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenStats {
    pub token_id: Uuid,
    pub price_history: Vec<PricePoint>,
    pub volume_history: Vec<VolumePoint>,
    pub holder_distribution: Vec<HolderInfo>,
    pub recent_transactions: Vec<crate::models::TransactionResponse>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PricePoint {
    pub timestamp: DateTime<Utc>,
    pub price: Decimal,
    pub volume: Decimal,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VolumePoint {
    pub timestamp: DateTime<Utc>,
    pub volume: Decimal,
    pub transaction_count: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HolderInfo {
    pub wallet_address: String,
    pub balance: Decimal,
    pub percentage: Decimal,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BuyTokenRequest {
    pub token_id: Uuid,
    pub sol_amount: Decimal,
    pub slippage_tolerance: Option<Decimal>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SellTokenRequest {
    pub token_id: Uuid,
    pub token_amount: Decimal,
    pub slippage_tolerance: Option<Decimal>,
}

impl From<Token> for TokenResponse {
    fn from(token: Token) -> Self {
        Self {
            id: token.id,
            mint_address: token.mint_address,
            creator_id: token.creator_id,
            creator_pubkey: token.creator_pubkey,
            name: token.name,
            symbol: token.symbol,
            description: token.description,
            icon_url: token.icon_url,
            website_url: token.website_url,
            twitter_url: token.twitter_url,
            telegram_url: token.telegram_url,
            total_supply: token.total_supply,
            current_supply: token.current_supply,
            market_cap: token.market_cap,
            current_price: token.current_price,
            price_change_24h: token.price_change_24h,
            volume_24h: token.volume_24h,
            holder_count: token.holder_count,
            transaction_count: token.transaction_count,
            is_verified: token.is_verified,
            bonding_curve_complete: token.bonding_curve_complete,
            graduation_threshold: token.graduation_threshold,
            created_at: token.created_at,
        }
    }
} 