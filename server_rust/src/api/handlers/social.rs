use axum::{extract::{Path, State}, Json};
use uuid::Uuid;
use validator::Validate;
use crate::api::AppState;
use crate::api::auth_utils::AuthUser;
use crate::database::repositories::FeedRepository;
use crate::error::AppResult;
use crate::models::{CreatePostRequest, PostResponse};

pub async fn get_feed(State(state): State<AppState>) -> AppResult<Json<serde_json::Value>> {
    let posts = FeedRepository::get_feed(state.db.get_pool()).await?;
    let post_responses = posts.into_iter().map(PostResponse::from).collect::<Vec<_>>();
    
    Ok(Json(serde_json::json!({
        "posts": post_responses,
        "pagination": {
            "page": 1,
            "limit": 50,
            "total": post_responses.len(),
            "total_pages": 1
        }
    })))
}

pub async fn create_post(
    State(state): State<AppState>, 
    auth_user: AuthUser,
    Json(request): Json<CreatePostRequest>
) -> AppResult<Json<PostResponse>> {
    request.validate().map_err(|e| {
        crate::error::AppError::Validation(format!("Validation failed: {:?}", e))
    })?;

    let post = FeedRepository::create_post(state.db.get_pool(), &request, auth_user.user_id).await?;

    Ok(Json(PostResponse::from(post)))
}

pub async fn get_post(State(state): State<AppState>, Path(id): Path<Uuid>) -> AppResult<Json<PostResponse>> {
    let post = FeedRepository::get_post_by_id(state.db.get_pool(), id).await?;
    Ok(Json(PostResponse::from(post)))
}

pub async fn like_post(State(state): State<AppState>, auth_user: AuthUser, Path(id): Path<Uuid>) -> AppResult<Json<serde_json::Value>> {
    let rows_affected = FeedRepository::like_post(state.db.get_pool(), id, auth_user.user_id).await?;

    Ok(Json(serde_json::json!({
        "message": "Post liked", 
        "post_id": id,
        "liked": rows_affected > 0
    })))
}

pub async fn unlike_post(State(state): State<AppState>, auth_user: AuthUser, Path(id): Path<Uuid>) -> AppResult<Json<serde_json::Value>> {
    let rows_affected = FeedRepository::unlike_post(state.db.get_pool(), id, auth_user.user_id).await?;

    Ok(Json(serde_json::json!({
        "message": "Post unliked", 
        "post_id": id,
        "unliked": rows_affected > 0
    })))
}

pub async fn get_comments(State(_state): State<AppState>, Path(_id): Path<Uuid>) -> AppResult<Json<Vec<serde_json::Value>>> {
    // TODO: Implement comments retrieval
    Ok(Json(vec![]))
}

pub async fn create_comment(State(_state): State<AppState>, Path(_id): Path<Uuid>, Json(_request): Json<serde_json::Value>) -> AppResult<Json<serde_json::Value>> {
    // TODO: Implement comment creation
    Ok(Json(serde_json::json!({"id": Uuid::new_v4(), "message": "Comment created"})))
}

pub async fn get_challenges(State(_state): State<AppState>) -> AppResult<Json<Vec<serde_json::Value>>> {
    // TODO: Implement challenges retrieval
    Ok(Json(vec![]))
}

pub async fn create_challenge(State(_state): State<AppState>, Json(_request): Json<serde_json::Value>) -> AppResult<Json<serde_json::Value>> {
    // TODO: Implement challenge creation
    Ok(Json(serde_json::json!({"id": Uuid::new_v4(), "message": "Challenge created"})))
}

pub async fn join_challenge(State(_state): State<AppState>, Path(id): Path<Uuid>) -> AppResult<Json<serde_json::Value>> {
    // TODO: Implement challenge joining
    Ok(Json(serde_json::json!({"message": "Joined challenge", "challenge_id": id})))
}

pub async fn get_leaderboard(State(_state): State<AppState>) -> AppResult<Json<Vec<serde_json::Value>>> {
    // TODO: Implement leaderboard retrieval
    Ok(Json(vec![]))
} 