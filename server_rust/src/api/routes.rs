use axum::{
    routing::{get, post, put, delete},
    Router,
};
use crate::api::{handlers::*, AppState};

pub fn create_routes() -> Router<AppState> {
    Router::new()
        // Health and Status
        .route("/health", get(health::health_check))
        .route("/api/health", get(health::health_check))
        .route("/api/status", get(health::status_check))
        .route("/api/websocket/health", get(health::websocket_health))
        .route("/metrics", get(health::metrics))
        
        // Authentication
        .route("/api/auth/login", post(auth::login))
        .route("/api/auth/logout", post(auth::logout))
        .route("/api/auth/refresh", post(auth::refresh_token))
        .route("/api/auth/verify", get(auth::verify_token))
        
        // User Management
        .route("/api/users", get(user::get_users))
        .route("/api/users", post(user::create_user))
        .route("/api/users/:id", get(user::get_user))
        .route("/api/users/:id", put(user::update_user))
        .route("/api/users/:id", delete(user::delete_user))
        .route("/api/users/:id/profile", get(user::get_user_profile))
        .route("/api/users/:id/tokens", get(user::get_user_tokens))
        .route("/api/users/:id/transactions", get(user::get_user_transactions))
        .route("/api/users/:id/portfolio", get(user::get_user_portfolio))
        .route("/api/users/:id/follow", post(user::follow_user))
        .route("/api/users/:id/unfollow", post(user::unfollow_user))
        .route("/api/users/:id/followers", get(user::get_followers))
        .route("/api/users/:id/following", get(user::get_following))
        
        // Token Management
        .route("/api/tokens", get(token::list_tokens))
        .route("/api/tokens", post(token::create_token))
        .route("/api/tokens/:id", get(token::get_token))
        .route("/api/tokens/:id", put(token::update_token))
        .route("/api/tokens/:id", delete(token::delete_token))
        .route("/api/tokens/:id/stats", get(token::get_token_stats))
        .route("/api/tokens/:id/holders", get(token::get_token_holders))
        .route("/api/tokens/:id/transactions", get(token::get_token_transactions))
        .route("/api/tokens/trending", get(token::get_trending_tokens))
        .route("/api/tokens/search", get(token::search_tokens))
        
        // Trading
        .route("/api/trading/buy", post(trading::buy_token))
        .route("/api/trading/sell", post(trading::sell_token))
        .route("/api/trading/quote", post(trading::get_quote))
        .route("/api/trading/orders", get(trading::get_orders))
        .route("/api/trading/orders/:id", get(trading::get_order))
        .route("/api/trading/orders/:id/cancel", post(trading::cancel_order))
        
        // Market Data
        .route("/api/market/overview", get(market::get_market_overview))
        .route("/api/market/tokens/:id/price", get(market::get_token_price))
        .route("/api/market/tokens/:id/chart", get(market::get_price_chart))
        .route("/api/market/tokens/:id/orderbook", get(market::get_order_book))
        .route("/api/market/tokens/:id/trades", get(market::get_recent_trades))
        .route("/api/market/gainers", get(market::get_top_gainers))
        .route("/api/market/losers", get(market::get_top_losers))
        .route("/api/market/volume", get(market::get_top_volume))
        
        // Transactions
        .route("/api/transactions", get(transaction::list_transactions))
        .route("/api/transactions/:id", get(transaction::get_transaction))
        .route("/api/transactions/:id/verify", post(transaction::verify_transaction))
        .route("/api/transactions/pending", get(transaction::get_pending_transactions))
        .route("/api/transactions/failed", get(transaction::get_failed_transactions))
        
        // Notifications
        .route("/api/notifications", get(notification::list_notifications))
        .route("/api/notifications/:id", get(notification::get_notification))
        .route("/api/notifications/:id/read", post(notification::mark_as_read))
        .route("/api/notifications/unread", get(notification::get_unread_notifications))
        .route("/api/notifications/settings", get(notification::get_notification_settings))
        .route("/api/notifications/settings", put(notification::update_notification_settings))
        .route("/api/notifications/price-alerts", get(notification::get_price_alerts))
        .route("/api/notifications/price-alerts", post(notification::create_price_alert))
        .route("/api/notifications/price-alerts/:id", delete(notification::delete_price_alert))
        
        // Analytics
        .route("/api/analytics/overview", get(analytics::get_overview))
        .route("/api/analytics/users", get(analytics::get_user_analytics))
        .route("/api/analytics/tokens", get(analytics::get_token_analytics))
        .route("/api/analytics/transactions", get(analytics::get_transaction_analytics))
        .route("/api/analytics/market", get(analytics::get_market_analytics))
        .route("/api/analytics/revenue", get(analytics::get_revenue_analytics))
        
        // Social Features
        .route("/api/social/feed", get(social::get_feed))
        .route("/api/social/posts", post(social::create_post))
        .route("/api/social/posts/:id", get(social::get_post))
        .route("/api/social/posts/:id/like", post(social::like_post))
        .route("/api/social/posts/:id/unlike", post(social::unlike_post))
        .route("/api/social/posts/:id/comments", get(social::get_comments))
        .route("/api/social/posts/:id/comments", post(social::create_comment))
        .route("/api/social/challenges", get(social::get_challenges))
        .route("/api/social/challenges", post(social::create_challenge))
        .route("/api/social/challenges/:id/join", post(social::join_challenge))
        .route("/api/social/leaderboard", get(social::get_leaderboard))
        
        // WebSocket
        .route("/ws", get(websocket::websocket_handler))
        .route("/api/ws/connections", get(websocket::get_connections))
        .route("/api/ws/broadcast", post(websocket::broadcast_message))
} 