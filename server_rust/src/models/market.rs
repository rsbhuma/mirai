use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MarketData {
    pub id: Uuid,
    pub token_id: Uuid,
    pub price: Decimal,
    pub volume_24h: Decimal,
    pub market_cap: Decimal,
    pub price_change_1h: Decimal,
    pub price_change_24h: Decimal,
    pub price_change_7d: Decimal,
    pub liquidity: Decimal,
    pub holder_count: i32,
    pub transaction_count_24h: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PriceHistory {
    pub id: Uuid,
    pub token_id: Uuid,
    pub price: Decimal,
    pub volume: Decimal,
    pub market_cap: Decimal,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TradingPair {
    pub id: Uuid,
    pub base_token_id: Uuid,
    pub quote_token_id: Uuid,
    pub current_price: Decimal,
    pub volume_24h: Decimal,
    pub price_change_24h: Decimal,
    pub liquidity: Decimal,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MarketOverview {
    pub total_market_cap: Decimal,
    pub total_volume_24h: Decimal,
    pub total_tokens: i64,
    pub active_traders_24h: i64,
    pub top_gainers: Vec<TokenMarketData>,
    pub top_losers: Vec<TokenMarketData>,
    pub trending_tokens: Vec<TokenMarketData>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenMarketData {
    pub token_id: Uuid,
    pub name: String,
    pub symbol: String,
    pub icon_url: Option<String>,
    pub current_price: Decimal,
    pub price_change_24h: Decimal,
    pub volume_24h: Decimal,
    pub market_cap: Decimal,
    pub holder_count: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PriceChart {
    pub token_id: Uuid,
    pub timeframe: String,
    pub data_points: Vec<PriceDataPoint>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PriceDataPoint {
    pub timestamp: DateTime<Utc>,
    pub open: Decimal,
    pub high: Decimal,
    pub low: Decimal,
    pub close: Decimal,
    pub volume: Decimal,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderBook {
    pub token_id: Uuid,
    pub bids: Vec<OrderBookEntry>,
    pub asks: Vec<OrderBookEntry>,
    pub spread: Decimal,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderBookEntry {
    pub price: Decimal,
    pub quantity: Decimal,
    pub total: Decimal,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MarketStats {
    pub token_id: Uuid,
    pub all_time_high: Decimal,
    pub all_time_low: Decimal,
    pub ath_date: DateTime<Utc>,
    pub atl_date: DateTime<Utc>,
    pub roi: Decimal,
    pub volatility_7d: Decimal,
    pub sharpe_ratio: Decimal,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TrendingToken {
    pub token_id: Uuid,
    pub name: String,
    pub symbol: String,
    pub icon_url: Option<String>,
    pub current_price: Decimal,
    pub price_change_24h: Decimal,
    pub volume_24h: Decimal,
    pub market_cap: Decimal,
    pub trending_score: Decimal,
    pub mentions_24h: i32,
}

impl From<MarketData> for TokenMarketData {
    fn from(market_data: MarketData) -> Self {
        Self {
            token_id: market_data.token_id,
            name: String::new(), // This would be joined from token table
            symbol: String::new(), // This would be joined from token table
            icon_url: None, // This would be joined from token table
            current_price: market_data.price,
            price_change_24h: market_data.price_change_24h,
            volume_24h: market_data.volume_24h,
            market_cap: market_data.market_cap,
            holder_count: market_data.holder_count,
        }
    }
} 