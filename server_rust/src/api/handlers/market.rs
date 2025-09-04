use axum::{extract::{Path, State}, Json};
use uuid::Uuid;
use crate::api::AppState;
use crate::models::*;
use crate::error::AppResult;

pub async fn get_market_overview(State(_state): State<AppState>) -> AppResult<Json<MarketOverview>> {
    let overview = MarketOverview {
        total_market_cap: rust_decimal::Decimal::ZERO,
        total_volume_24h: rust_decimal::Decimal::ZERO,
        total_tokens: 0,
        active_traders_24h: 0,
        top_gainers: vec![],
        top_losers: vec![],
        trending_tokens: vec![],
    };
    Ok(Json(overview))
}

pub async fn get_token_price(State(_state): State<AppState>, Path(_id): Path<Uuid>) -> AppResult<Json<serde_json::Value>> {
    Ok(Json(serde_json::json!({"price": "0.001", "change_24h": "5.2%"})))
}

pub async fn get_price_chart(State(_state): State<AppState>, Path(_id): Path<Uuid>) -> AppResult<Json<PriceChart>> {
    let chart = PriceChart {
        token_id: Uuid::new_v4(),
        timeframe: "1h".to_string(),
        data_points: vec![],
    };
    Ok(Json(chart))
}

pub async fn get_order_book(State(_state): State<AppState>, Path(_id): Path<Uuid>) -> AppResult<Json<OrderBook>> {
    let order_book = OrderBook {
        token_id: Uuid::new_v4(),
        bids: vec![],
        asks: vec![],
        spread: rust_decimal::Decimal::ZERO,
        last_updated: chrono::Utc::now(),
    };
    Ok(Json(order_book))
}

pub async fn get_recent_trades(State(_state): State<AppState>, Path(_id): Path<Uuid>) -> AppResult<Json<Vec<serde_json::Value>>> {
    Ok(Json(vec![]))
}

pub async fn get_top_gainers(State(_state): State<AppState>) -> AppResult<Json<Vec<TokenMarketData>>> {
    Ok(Json(vec![]))
}

pub async fn get_top_losers(State(_state): State<AppState>) -> AppResult<Json<Vec<TokenMarketData>>> {
    Ok(Json(vec![]))
}

pub async fn get_top_volume(State(_state): State<AppState>) -> AppResult<Json<Vec<TokenMarketData>>> {
    Ok(Json(vec![]))
} 