use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "content_type", rename_all = "lowercase")]
pub enum ContentType {
    Text,
    Image,
    Video,
    Link,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Post {
    pub id: Uuid,
    pub creator_id: Uuid,
    pub content_type: ContentType,
    pub title: String,
    pub description: String,
    pub media_url: Option<String>,
    pub external_url: Option<String>,
    pub vision: String,
    pub twitter_url: Option<String>,
    pub discord_url: Option<String>,
    pub github_url: Option<String>,
    pub likes_count: i32,
    pub comments_count: i32,
    pub token_id: Option<Uuid>,
    pub is_published: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CreatePostRequest {
    #[validate(length(min = 1, max = 200))]
    pub title: String,
    #[validate(length(min = 1, max = 10000))]
    pub description: String,
    #[validate(length(min = 1, max = 10000))]
    pub vision: String,
    pub content_type: Option<String>, // Will be converted to ContentType
    #[validate(url)]
    pub media_url: Option<String>,
    #[validate(url)]
    pub twitter: Option<String>,
    #[validate(url)]
    pub discord: Option<String>,
    #[validate(url)]
    pub github: Option<String>,
    pub token_id: Option<Uuid>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostResponse {
    pub id: Uuid,
    pub creator_id: Uuid,
    pub content_type: ContentType,
    pub title: String,
    pub description: String,
    pub media_url: Option<String>,
    pub external_url: Option<String>,
    pub vision: String,
    pub twitter_url: Option<String>,
    pub discord_url: Option<String>,
    pub github_url: Option<String>,
    pub likes_count: i32,
    pub comments_count: i32,
    pub token_id: Option<Uuid>,
    pub is_published: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<Post> for PostResponse {
    fn from(post: Post) -> Self {
        Self {
            id: post.id,
            creator_id: post.creator_id,
            content_type: post.content_type,
            title: post.title,
            description: post.description,
            media_url: post.media_url,
            external_url: post.external_url,
            vision: post.vision,
            twitter_url: post.twitter_url,
            discord_url: post.discord_url,
            github_url: post.github_url,
            likes_count: post.likes_count,
            comments_count: post.comments_count,
            token_id: post.token_id,
            is_published: post.is_published,
            created_at: post.created_at,
            updated_at: post.updated_at,
        }
    }
}

impl CreatePostRequest {
    pub fn get_content_type(&self) -> ContentType {
        match self.content_type.as_deref() {
            Some("image") => ContentType::Image,
            Some("video") => ContentType::Video,
            Some("link") => ContentType::Link,
            _ => ContentType::Text,
        }
    }

    pub fn get_media_or_external_url(&self) -> (Option<String>, Option<String>) {
        let content_type = self.get_content_type();
        match content_type {
            ContentType::Link => (None, self.media_url.clone()),
            ContentType::Image | ContentType::Video => (self.media_url.clone(), None),
            ContentType::Text => (None, None),
        }
    }
} 