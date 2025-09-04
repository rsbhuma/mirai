use sqlx::{PgPool, postgres::PgPoolOptions};
use crate::error::{AppError, AppResult};
use serde::Serialize;

#[derive(Clone)]
pub struct DatabaseManager {
    pool: PgPool,
    read_pools: Option<Vec<PgPool>>,
}

#[derive(Debug, Serialize)]
pub struct ConnectionStats {
    pub active_connections: u32,
    pub idle_connections: u32,
    pub max_connections: u32,
}

impl DatabaseManager {
    pub async fn new(database_url: &str, read_urls: Option<Vec<String>>) -> AppResult<Self> {
        println!("Database URL: {}", database_url);
        // Create main write pool
        let pool = PgPoolOptions::new()
            .max_connections(20)
            .connect(database_url)
            .await
            .map_err(|e| AppError::Database(format!("Failed to create database pool: {}", e)))?;

        // Create read pools if provided
        let read_pools = if let Some(urls) = read_urls {
            let mut pools = Vec::new();
            for url in urls {
                match PgPoolOptions::new()
                    .max_connections(10)
                    .connect(&url)
                    .await
                {
                    Ok(read_pool) => pools.push(read_pool),
                    Err(e) => {
                        tracing::warn!("Failed to create read pool for {}: {}", url, e);
                    }
                }
            }
            if pools.is_empty() { None } else { Some(pools) }
        } else {
            None
        };

        Ok(Self { pool, read_pools })
    }

    pub fn get_pool(&self) -> &PgPool {
        &self.pool
    }

    pub fn get_read_pool(&self) -> &PgPool {
        // Return first read pool if available, otherwise main pool
        if let Some(pools) = &self.read_pools {
            pools.first().unwrap_or(&self.pool)
        } else {
            &self.pool
        }
    }

    pub async fn health_check(&self) -> AppResult<bool> {
        match sqlx::query("SELECT 1")
            .fetch_one(&self.pool)
            .await
        {
            Ok(_) => Ok(true),
            Err(e) => {
                tracing::error!("Database health check failed: {}", e);
                Ok(false)
            }
        }
    }

    pub async fn get_connection_stats(&self) -> ConnectionStats {
        ConnectionStats {
            active_connections: self.pool.size(),
            idle_connections: self.pool.num_idle() as u32,
            max_connections: self.pool.options().get_max_connections(),
        }
    }

    #[cfg(test)]
    pub fn new_mock() -> Self {
        // Create a mock database manager for testing
        Self {
            pool: unsafe { std::mem::zeroed() },
            read_pools: None,
        }
    }
} 