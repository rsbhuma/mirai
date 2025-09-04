use async_trait::async_trait;
use axum::{
    extract::FromRequestParts,
    http::{request::Parts},
};
use axum_extra::extract::cookie::{CookieJar};
use jsonwebtoken::{decode, Validation, DecodingKey};
use uuid::Uuid;
use crate::{
    api::{AppState, handlers::auth::Claims},
    error::{AppError},
};

pub struct AuthUser {
    pub user_id: Uuid,
    pub wallet_address: String,
}

#[async_trait]
impl FromRequestParts<AppState> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        let jar = CookieJar::from_headers(&parts.headers);

        let token_cookie = jar.get("token").ok_or(AppError::Auth("Missing authentication token".to_string()))?;
        let token = token_cookie.value();

        let decoding_key = DecodingKey::from_secret(state.config.jwt_secret.as_ref());
        let mut validation = Validation::new(jsonwebtoken::Algorithm::HS256);
        validation.set_audience(&["community_coin"]);

        let claims = decode::<Claims>(token, &decoding_key, &validation)
            .map_err(|e| AppError::Auth(format!("Invalid token: {}", e)))?
            .claims;
        
        let user_id = Uuid::parse_str(&claims.sub)
            .map_err(|_| AppError::Auth("Invalid user ID in token".to_string()))?;

        Ok(AuthUser {
            user_id,
            wallet_address: claims.wallet,
        })
    }
} 