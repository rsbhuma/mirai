use axum::{extract::{Path, Query, State}, Json};
use uuid::Uuid;
use crate::api::AppState;
use crate::database::TokenRepository;
use crate::models::*;
use crate::error::AppResult;

#[derive(serde::Deserialize)]
pub struct PaginationQuery {
    page: Option<i32>,
    per_page: Option<i32>,
}

pub async fn create_token(
    State(state): State<AppState>,
    Json(request): Json<CreateTokenRequest>,
) -> AppResult<Json<TokenResponse>> {
    let creator_id = Uuid::new_v4(); // TODO: Get from auth
    let creator_pubkey = "mock_pubkey".to_string();
    let mint_address = format!("mint_{}", Uuid::new_v4());
    
    let token = TokenRepository::create(
        state.db.get_pool(),
        request,
        creator_id,
        creator_pubkey,
        mint_address,
    ).await?;
    
    Ok(Json(token.into()))
}

pub async fn get_token(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<TokenResponse>> {
    let token = TokenRepository::get_by_id(state.db.get_read_pool(), id)
        .await?
        .ok_or_else(|| crate::error::AppError::NotFound("Token not found".to_string()))?;
    
    Ok(Json(token.into()))
}

pub async fn update_token(
    State(_state): State<AppState>,
    Path(_id): Path<Uuid>,
    Json(_request): Json<UpdateTokenRequest>,
) -> AppResult<Json<TokenResponse>> {
    // TODO: Implement token update
    Err(crate::error::AppError::NotImplemented("Token update not implemented".to_string()))
}

pub async fn delete_token(
    State(_state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    Ok(Json(serde_json::json!({
        "message": "Token deleted successfully",
        "token_id": id
    })))
}

pub async fn list_tokens(
    State(state): State<AppState>,
    Query(params): Query<PaginationQuery>,
) -> AppResult<Json<Vec<TokenResponse>>> {
    let page = params.page.unwrap_or(1);
    let per_page = params.per_page.unwrap_or(20).min(100);
    
    let tokens = TokenRepository::list(state.db.get_read_pool(), page, per_page).await?;
    let token_responses: Vec<TokenResponse> = tokens.into_iter().map(|t| t.into()).collect();
    
    Ok(Json(token_responses))
}

pub async fn get_token_stats(
    State(_state): State<AppState>,
    Path(_id): Path<Uuid>,
) -> AppResult<Json<TokenStats>> {
    // TODO: Implement token stats
    let stats = TokenStats {
        token_id: Uuid::new_v4(),
        price_history: vec![],
        volume_history: vec![],
        holder_distribution: vec![],
        recent_transactions: vec![],
    };
    Ok(Json(stats))
}

pub async fn get_token_holders(
    State(_state): State<AppState>,
    Path(_id): Path<Uuid>,
) -> AppResult<Json<Vec<HolderInfo>>> {
    Ok(Json(vec![]))
}

pub async fn get_token_transactions(
    State(_state): State<AppState>,
    Path(_id): Path<Uuid>,
) -> AppResult<Json<Vec<TransactionResponse>>> {
    Ok(Json(vec![]))
}

pub async fn get_trending_tokens(
    State(_state): State<AppState>,
) -> AppResult<Json<Vec<TokenResponse>>> {
    Ok(Json(vec![]))
}

pub async fn search_tokens(
    State(_state): State<AppState>,
    Query(_params): Query<std::collections::HashMap<String, String>>,
) -> AppResult<Json<Vec<TokenResponse>>> {
    Ok(Json(vec![]))
} 