use axum::{extract::State, Json};
use axum_extra::extract::cookie::{Cookie, CookieJar};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use jsonwebtoken::{encode, decode, Header, Algorithm, Validation, EncodingKey, DecodingKey};
use chrono::{Utc, Duration};
use crate::api::AppState;
use crate::error::{AppResult, AppError};
use crate::database::repositories::UserRepository;
use ed25519_dalek::{Verifier, VerifyingKey, Signature};
use bs58;

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub wallet_address: String,
    pub signature: String,
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user_id: Uuid,
    pub expires_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,        // Subject (user_id)
    pub wallet: String,     // Wallet address
    pub exp: i64,          // Expiration time
    pub iat: i64,          // Issued at
    pub aud: String,       // Audience
}

pub async fn login(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(request): Json<LoginRequest>,
) -> AppResult<(CookieJar, Json<LoginResponse>)> {
    // 1. Verify wallet ownership
    let pubkey_bytes: [u8; 32] = bs58::decode(&request.wallet_address)
        .into_vec()
        .map_err(|_| AppError::Auth("Invalid wallet address format".to_string()))?
        .try_into()
        .map_err(|_| AppError::Auth("Invalid wallet address length".to_string()))?;
    
    let signature_bytes: [u8; 64] = bs58::decode(&request.signature)
        .into_vec()
        .map_err(|_| AppError::Auth("Invalid signature format".to_string()))?
        .try_into()
        .map_err(|_| AppError::Auth("Invalid signature length".to_string()))?;
    
    let message = request.message.as_bytes();

    let verifying_key = VerifyingKey::from_bytes(&pubkey_bytes)
        .map_err(|_| AppError::Auth("Invalid public key".to_string()))?;
    
    let signature = Signature::from_bytes(&signature_bytes);
    
    if verifying_key.verify(message, &signature).is_err() {
        return Err(AppError::Auth("Invalid signature".to_string()));
    }

    // 2. Get or create user
    let user = match UserRepository::get_by_wallet_address(state.db.get_pool(), &request.wallet_address).await? {
        Some(user) => user,
        None => UserRepository::create(state.db.get_pool(), &request.wallet_address).await?,
    };

    // 3. Create JWT claims
    let now = Utc::now();
    let expires_at = now + Duration::hours(state.config.jwt_expiry_hours);

    let claims = Claims {
        sub: user.id.to_string(),
        wallet: user.wallet_address.clone(),
        exp: expires_at.timestamp(),
        iat: now.timestamp(),
        aud: "community_coin".to_string(),
    };

    // 4. Generate JWT token
    let token = encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(state.config.jwt_secret.as_ref()),
    )
    .map_err(|e| AppError::Auth(format!("Failed to generate token: {}", e)))?;

    // 5. Store session in Redis if available
    {
        let session_key = format!("session:{}", user.id);
        let session_data = serde_json::json!({
            "user_id": user.id,
            "wallet_address": user.wallet_address,
            "created_at": now,
            "expires_at": expires_at
        })
        .to_string();

        let redis_guard = state.redis.lock().await;
        let _ = redis_guard
            .set(
                &session_key,
                &session_data,
                Some(std::time::Duration::from_secs(
                    state.config.jwt_expiry_hours as u64 * 3600,
                )),
            )
            .await;
    }

    // 6. Set cookie and return response
    let cookie = Cookie::build(("token", token.clone()))
        .path("/")
        .http_only(true)
        .secure(true)
        .expires(cookie::time::OffsetDateTime::from_unix_timestamp(expires_at.timestamp()).unwrap());

    let new_jar = jar.add(cookie);

    Ok((
        new_jar,
        Json(LoginResponse {
            token,
            user_id: user.id,
            expires_at,
        }),
    ))
}

pub async fn logout(
    jar: CookieJar,
) -> AppResult<(CookieJar, Json<serde_json::Value>)> {
    let new_jar = jar.remove(Cookie::from("token"));
    
    Ok((new_jar, Json(serde_json::json!({
        "message": "Logged out successfully"
    }))))
}

pub async fn refresh_token(
    State(state): State<AppState>,
    Json(request): Json<RefreshTokenRequest>,
) -> AppResult<Json<LoginResponse>> {
    // Decode the refresh token to get user info
    let validation = Validation::new(Algorithm::HS256);
    let token_data = decode::<Claims>(
        &request.refresh_token,
        &DecodingKey::from_secret(state.config.jwt_secret.as_ref()),
        &validation,
    ).map_err(|e| AppError::Auth(format!("Invalid refresh token: {}", e)))?;
    
    let user_id = Uuid::parse_str(&token_data.claims.sub)
        .map_err(|e| AppError::Auth(format!("Invalid user ID in token: {}", e)))?;
    
    // Generate new JWT token
    let now = Utc::now();
    let expires_at = now + Duration::hours(state.config.jwt_expiry_hours);
    
    let claims = Claims {
        sub: user_id.to_string(),
        wallet: token_data.claims.wallet,
        exp: expires_at.timestamp(),
        iat: now.timestamp(),
        aud: "community_coin".to_string(),
    };
    
    let token = encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(state.config.jwt_secret.as_ref()),
    ).map_err(|e| AppError::Auth(format!("Failed to generate token: {}", e)))?;
    
    Ok(Json(LoginResponse {
        token,
        user_id,
        expires_at,
    }))
}

pub async fn verify_token(
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    // TODO: Extract JWT token from Authorization header
    // TODO: Verify JWT signature and expiration
    // TODO: Return user information if valid
    
    // For now, return mock success
    Ok(Json(serde_json::json!({
        "valid": true,
        "user_id": Uuid::new_v4(),
        "expires_at": Utc::now() + Duration::hours(state.config.jwt_expiry_hours)
    })))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::Config;
    use crate::database::DatabaseManager;
    use crate::cache::RedisClient;
    use crate::blockchain::SolanaClient;
    use crate::websocket::WebSocketManager;
    use std::sync::Arc;
    use tokio::sync::Mutex;

    fn create_test_app_state() -> AppState {
        let config = Config {
            port: 8080,
            database_url: "test".to_string(),
            database_read_urls: None,
            redis_url: "test".to_string(),
            solana_rpc_url: "test".to_string(),
            solana_ws_url: "test".to_string(),
            helius_api_key: None,
            jwt_secret: "test_secret_key_at_least_32_characters_long".to_string(),
            jwt_expiry_hours: 24,
            commcoin_program_id: "test".to_string(),
            environment: "test".to_string(),
            log_level: "info".to_string(),
        };
        
        // Create mock dependencies
        let db = DatabaseManager::new_mock();
        let redis = RedisClient::new_mock();
        let solana = SolanaClient::new_mock();
        let websocket_manager = WebSocketManager::new();
        
        AppState::new(db, redis, solana, websocket_manager, config)
    }

    #[tokio::test]
    async fn test_login_success() {
        let state = create_test_app_state();
        
        let request = LoginRequest {
            wallet_address: "test_wallet".to_string(),
            signature: "test_signature".to_string(),
            message: "Login to Community Coin".to_string(),
        };
        
        let result = login(State(state), CookieJar::new(), Json(request)).await;
        assert!(result.is_ok());
        
        let (jar, response) = result.unwrap();
        assert!(!response.token.is_empty());
        assert!(response.expires_at > Utc::now());
        assert!(jar.get("token").is_some());
    }

    #[tokio::test]
    async fn test_login_empty_message() {
        let state = create_test_app_state();
        
        let request = LoginRequest {
            wallet_address: "test_wallet".to_string(),
            signature: "test_signature".to_string(),
            message: "".to_string(),
        };
        
        let result = login(State(state), CookieJar::new(), Json(request)).await;
        assert!(result.is_err());
        
        match result.unwrap_err() {
            AppError::Auth(msg) => assert_eq!(msg, "Invalid signature or message"),
            _ => panic!("Expected Auth error"),
        }
    }

    #[tokio::test]
    async fn test_login_empty_signature() {
        let state = create_test_app_state();
        
        let request = LoginRequest {
            wallet_address: "test_wallet".to_string(),
            signature: "".to_string(),
            message: "Login to Community Coin".to_string(),
        };
        
        let result = login(State(state), CookieJar::new(), Json(request)).await;
        assert!(result.is_err());
        
        match result.unwrap_err() {
            AppError::Auth(msg) => assert_eq!(msg, "Invalid signature or message"),
            _ => panic!("Expected Auth error"),
        }
    }

    #[tokio::test]
    async fn test_jwt_token_creation_and_validation() {
        let secret = "test_secret_key_at_least_32_characters_long";
        let user_id = Uuid::new_v4();
        let wallet = "test_wallet";
        
        let now = Utc::now();
        let expires_at = now + Duration::hours(24);
        
        let claims = Claims {
            sub: user_id.to_string(),
            wallet: wallet.to_string(),
            exp: expires_at.timestamp(),
            iat: now.timestamp(),
            aud: "community_coin".to_string(),
        };
        
        // Create token
        let token = encode(
            &Header::new(Algorithm::HS256),
            &claims,
            &EncodingKey::from_secret(secret.as_ref()),
        ).expect("Failed to create token");
        
        // Validate token
        let validation = Validation::new(Algorithm::HS256);
        let token_data = decode::<Claims>(
            &token,
            &DecodingKey::from_secret(secret.as_ref()),
            &validation,
        ).expect("Failed to decode token");
        
        assert_eq!(token_data.claims.sub, user_id.to_string());
        assert_eq!(token_data.claims.wallet, wallet);
        assert_eq!(token_data.claims.aud, "community_coin");
    }

    #[tokio::test]
    async fn test_refresh_token_success() {
        let state = create_test_app_state();
        let user_id = Uuid::new_v4();
        
        // Create a valid token first
        let now = Utc::now();
        let expires_at = now + Duration::hours(24);
        
        let claims = Claims {
            sub: user_id.to_string(),
            wallet: "test_wallet".to_string(),
            exp: expires_at.timestamp(),
            iat: now.timestamp(),
            aud: "community_coin".to_string(),
        };
        
        let refresh_token = encode(
            &Header::new(Algorithm::HS256),
            &claims,
            &EncodingKey::from_secret(state.config.jwt_secret.as_ref()),
        ).expect("Failed to create refresh token");
        
        let request = RefreshTokenRequest { refresh_token };
        
        let result = refresh_token(State(state), Json(request)).await;
        assert!(result.is_ok());
        
        let response = result.unwrap().0;
        assert!(!response.token.is_empty());
        assert_eq!(response.user_id, user_id);
    }

    #[tokio::test]
    async fn test_refresh_token_invalid() {
        let state = create_test_app_state();
        
        let request = RefreshTokenRequest {
            refresh_token: "invalid_token".to_string(),
        };
        
        let result = refresh_token(State(state), Json(request)).await;
        assert!(result.is_err());
        
        match result.unwrap_err() {
            AppError::Auth(msg) => assert!(msg.contains("Invalid refresh token")),
            _ => panic!("Expected Auth error"),
        }
    }

    #[tokio::test]
    async fn test_logout_success() {
        let state = create_test_app_state();
        let user_id = Uuid::new_v4();
        
        // Create a valid token first
        let now = Utc::now();
        let expires_at = now + Duration::hours(24);
        
        let claims = Claims {
            sub: user_id.to_string(),
            wallet: "test_wallet".to_string(),
            exp: expires_at.timestamp(),
            iat: now.timestamp(),
            aud: "community_coin".to_string(),
        };
        
        let token = encode(
            &Header::new(Algorithm::HS256),
            &claims,
            &EncodingKey::from_secret(state.config.jwt_secret.as_ref()),
        ).expect("Failed to create token");

        let jar = CookieJar::new().add(Cookie::build("token", token).path("/").http_only(true).secure(true).expires(cookie::time::OffsetDateTime::from_unix_timestamp(expires_at.timestamp()).unwrap()));
        
        let result = logout(jar).await;
        assert!(result.is_ok());
        
        let (new_jar, response) = result.unwrap();
        assert!(new_jar.get("token").is_none());
        assert_eq!(response.json, serde_json::json!({"message": "Logged out successfully"}));
    }
} 