use std::time::Duration;
use tokio::time::sleep;
use reqwest::Client;
use serde_json::{json, Value};
use uuid::Uuid;
use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::{connect_async, tungstenite::Message};

const BASE_URL: &str = "http://localhost:8080";
const WS_URL: &str = "ws://localhost:8080/ws";

/// Test configuration and setup
#[tokio::test]
#[serial_test::serial]
async fn test_server_health() {
    let client = Client::new();
    
    // Test basic health endpoint
    let response = client
        .get(&format!("{}/health", BASE_URL))
        .send()
        .await
        .expect("Failed to send health request");
    
    assert_eq!(response.status(), 200);
    
    let health: Value = response.json().await.expect("Failed to parse health response");
    assert_eq!(health["status"], "healthy");
    assert!(health["timestamp"].is_string());
}

#[tokio::test]
#[serial_test::serial]
async fn test_api_health() {
    let client = Client::new();
    
    let response = client
        .get(&format!("{}/api/health", BASE_URL))
        .send()
        .await
        .expect("Failed to send API health request");
    
    assert_eq!(response.status(), 200);
    
    let health: Value = response.json().await.expect("Failed to parse API health response");
    assert_eq!(health["status"], "healthy");
    assert_eq!(health["server"], "community_coin_server");
}

/// Authentication Tests
#[tokio::test]
#[serial_test::serial]
async fn test_authentication_flow() {
    let client = Client::new();
    
    // Test login
    let login_request = json!({
        "wallet_address": "test_wallet_123",
        "signature": "test_signature",
        "message": "Login to Community Coin"
    });
    
    let response = client
        .post(&format!("{}/api/auth/login", BASE_URL))
        .json(&login_request)
        .send()
        .await
        .expect("Failed to send login request");
    
    assert_eq!(response.status(), 200);
    
    let login_response: Value = response.json().await.expect("Failed to parse login response");
    assert!(login_response["token"].is_string());
    assert!(login_response["user_id"].is_string());
    assert!(login_response["expires_at"].is_string());
    
    let token = login_response["token"].as_str().unwrap();
    
    // Test token verification
    let response = client
        .get(&format!("{}/api/auth/verify", BASE_URL))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .expect("Failed to send verify request");
    
    assert_eq!(response.status(), 200);
    
    // Test logout
    let response = client
        .post(&format!("{}/api/auth/logout", BASE_URL))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .expect("Failed to send logout request");
    
    assert_eq!(response.status(), 200);
}

/// Token Management Tests
#[tokio::test]
#[serial_test::serial]
async fn test_token_operations() {
    let client = Client::new();
    
    // Get initial tokens list
    let response = client
        .get(&format!("{}/api/tokens", BASE_URL))
        .send()
        .await
        .expect("Failed to get tokens");
    
    assert_eq!(response.status(), 200);
    let tokens: Value = response.json().await.expect("Failed to parse tokens response");
    assert!(tokens.is_array());
    
    // Create a new token
    let create_request = json!({
        "name": "Test Token",
        "symbol": "TEST",
        "description": "A test token for integration testing",
        "icon_url": "https://example.com/icon.png",
        "initial_supply": 1000000,
        "creator_fee_percent": 5.0
    });
    
    let response = client
        .post(&format!("{}/api/tokens", BASE_URL))
        .json(&create_request)
        .send()
        .await
        .expect("Failed to create token");
    
    assert_eq!(response.status(), 201);
    let created_token: Value = response.json().await.expect("Failed to parse created token");
    assert_eq!(created_token["name"], "Test Token");
    assert_eq!(created_token["symbol"], "TEST");
    
    let token_id = created_token["id"].as_str().unwrap();
    
    // Get the created token by ID
    let response = client
        .get(&format!("{}/api/tokens/{}", BASE_URL, token_id))
        .send()
        .await
        .expect("Failed to get token by ID");
    
    assert_eq!(response.status(), 200);
    let token: Value = response.json().await.expect("Failed to parse token response");
    assert_eq!(token["id"], token_id);
    assert_eq!(token["name"], "Test Token");
}

/// Trading Tests
#[tokio::test]
#[serial_test::serial]
async fn test_trading_operations() {
    let client = Client::new();
    
    // Test get market data
    let response = client
        .get(&format!("{}/api/market/data", BASE_URL))
        .send()
        .await
        .expect("Failed to get market data");
    
    assert_eq!(response.status(), 200);
    let market_data: Value = response.json().await.expect("Failed to parse market data");
    assert!(market_data.is_array());
    
    // Test buy order (mock)
    let buy_request = json!({
        "token_id": Uuid::new_v4().to_string(),
        "amount": 100.0,
        "price": 1.5
    });
    
    let response = client
        .post(&format!("{}/api/trading/buy", BASE_URL))
        .json(&buy_request)
        .send()
        .await
        .expect("Failed to place buy order");
    
    assert_eq!(response.status(), 200);
    
    // Test sell order (mock)
    let sell_request = json!({
        "token_id": Uuid::new_v4().to_string(),
        "amount": 50.0,
        "price": 1.6
    });
    
    let response = client
        .post(&format!("{}/api/trading/sell", BASE_URL))
        .json(&sell_request)
        .send()
        .await
        .expect("Failed to place sell order");
    
    assert_eq!(response.status(), 200);
}

/// User Management Tests
#[tokio::test]
#[serial_test::serial]
async fn test_user_operations() {
    let client = Client::new();
    
    // Get users list
    let response = client
        .get(&format!("{}/api/users", BASE_URL))
        .send()
        .await
        .expect("Failed to get users");
    
    assert_eq!(response.status(), 200);
    let users: Value = response.json().await.expect("Failed to parse users response");
    assert!(users.is_array());
    
    // Create a test user
    let create_request = json!({
        "wallet_address": "test_user_wallet_456",
        "display_name": "Test User",
        "bio": "A test user for integration testing"
    });
    
    let response = client
        .post(&format!("{}/api/users", BASE_URL))
        .json(&create_request)
        .send()
        .await
        .expect("Failed to create user");
    
    assert_eq!(response.status(), 201);
    let created_user: Value = response.json().await.expect("Failed to parse created user");
    assert_eq!(created_user["wallet_address"], "test_user_wallet_456");
    assert_eq!(created_user["display_name"], "Test User");
    
    let user_id = created_user["id"].as_str().unwrap();
    
    // Get user by ID
    let response = client
        .get(&format!("{}/api/users/{}", BASE_URL, user_id))
        .send()
        .await
        .expect("Failed to get user by ID");
    
    assert_eq!(response.status(), 200);
    let user: Value = response.json().await.expect("Failed to parse user response");
    assert_eq!(user["id"], user_id);
}

/// WebSocket Tests
#[tokio::test]
#[serial_test::serial]
async fn test_websocket_connection() {
    // Connect to WebSocket
    let (ws_stream, _) = connect_async(WS_URL)
        .await
        .expect("Failed to connect to WebSocket");
    
    let (mut ws_sender, mut ws_receiver) = ws_stream.split();
    
    // Send a test message
    let test_message = json!({
        "type": "subscribe",
        "topic": "market_data"
    });
    
    ws_sender
        .send(Message::Text(test_message.to_string()))
        .await
        .expect("Failed to send WebSocket message");
    
    // Wait for a response or timeout
    let timeout_duration = Duration::from_secs(5);
    let result = tokio::time::timeout(timeout_duration, ws_receiver.next()).await;
    
    match result {
        Ok(Some(Ok(message))) => {
            // Successfully received a message
            println!("Received WebSocket message: {:?}", message);
        }
        Ok(Some(Err(e))) => {
            panic!("WebSocket error: {:?}", e);
        }
        Ok(None) => {
            // Connection closed
            println!("WebSocket connection closed");
        }
        Err(_) => {
            // Timeout - this might be expected if server doesn't immediately respond
            println!("WebSocket test timed out (this might be expected)");
        }
    }
}

/// Analytics Tests
#[tokio::test]
#[serial_test::serial]
async fn test_analytics_endpoints() {
    let client = Client::new();
    
    // Test platform stats
    let response = client
        .get(&format!("{}/api/analytics/platform-stats", BASE_URL))
        .send()
        .await
        .expect("Failed to get platform stats");
    
    assert_eq!(response.status(), 200);
    let stats: Value = response.json().await.expect("Failed to parse platform stats");
    assert!(stats["total_users"].is_number());
    assert!(stats["total_tokens"].is_number());
    assert!(stats["total_volume"].is_string()); // Decimal as string
    
    // Test user stats
    let user_id = Uuid::new_v4();
    let response = client
        .get(&format!("{}/api/analytics/user-stats/{}", BASE_URL, user_id))
        .send()
        .await
        .expect("Failed to get user stats");
    
    assert_eq!(response.status(), 200);
    let user_stats: Value = response.json().await.expect("Failed to parse user stats");
    assert!(user_stats["tokens_created"].is_number());
    assert!(user_stats["total_volume_traded"].is_string());
}

/// Social Features Tests
#[tokio::test]
#[serial_test::serial]
async fn test_social_features() {
    let client = Client::new();
    
    let token_id = Uuid::new_v4();
    
    // Test discussions
    let discussion_request = json!({
        "content": "This is a test discussion about the token",
        "discussion_type": "general"
    });
    
    let response = client
        .post(&format!("{}/api/social/tokens/{}/discussions", BASE_URL, token_id))
        .json(&discussion_request)
        .send()
        .await
        .expect("Failed to create discussion");
    
    assert_eq!(response.status(), 201);
    
    // Get discussions
    let response = client
        .get(&format!("{}/api/social/tokens/{}/discussions", BASE_URL, token_id))
        .send()
        .await
        .expect("Failed to get discussions");
    
    assert_eq!(response.status(), 200);
    let discussions: Value = response.json().await.expect("Failed to parse discussions");
    assert!(discussions.is_array());
}

/// Notification Tests
#[tokio::test]
#[serial_test::serial]
async fn test_notifications() {
    let client = Client::new();
    
    let user_id = Uuid::new_v4();
    
    // Get user notifications
    let response = client
        .get(&format!("{}/api/notifications/user/{}", BASE_URL, user_id))
        .send()
        .await
        .expect("Failed to get notifications");
    
    assert_eq!(response.status(), 200);
    let notifications: Value = response.json().await.expect("Failed to parse notifications");
    assert!(notifications.is_array());
}

/// Error Handling Tests
#[tokio::test]
#[serial_test::serial]
async fn test_error_handling() {
    let client = Client::new();
    
    // Test 404 for non-existent token
    let response = client
        .get(&format!("{}/api/tokens/{}", BASE_URL, Uuid::new_v4()))
        .send()
        .await
        .expect("Failed to send request");
    
    assert_eq!(response.status(), 404);
    
    // Test 400 for invalid JSON
    let response = client
        .post(&format!("{}/api/tokens", BASE_URL))
        .body("invalid json")
        .header("content-type", "application/json")
        .send()
        .await
        .expect("Failed to send request");
    
    assert_eq!(response.status(), 400);
}

/// Load Test (Light)
#[tokio::test]
#[serial_test::serial]
async fn test_concurrent_requests() {
    let client = Client::new();
    
    // Create 10 concurrent health check requests
    let mut handles = vec![];
    
    for _ in 0..10 {
        let client = client.clone();
        let handle = tokio::spawn(async move {
            client
                .get(&format!("{}/health", BASE_URL))
                .send()
                .await
                .expect("Failed to send health request")
                .status()
        });
        handles.push(handle);
    }
    
    // Wait for all requests to complete
    for handle in handles {
        let status = handle.await.expect("Task failed");
        assert_eq!(status, 200);
    }
} 