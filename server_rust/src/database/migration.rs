use std::path::Path;
use std::fs;
use chrono::Utc;
use sqlx::PgPool;
use crate::error::{AppResult, AppError};

pub struct MigrationManager;

impl MigrationManager {
    /// Create a new migration file
    pub fn create_migration(name: &str) -> AppResult<String> {
        let timestamp = Utc::now().format("%Y%m%d%H%M%S");
        let filename = format!("{}_{}.sql", timestamp, name.replace(" ", "_").to_lowercase());
        let migrations_dir = Path::new("migrations");
        
        if !migrations_dir.exists() {
            fs::create_dir_all(migrations_dir)
                .map_err(|e| AppError::Database(format!("Failed to create migrations directory: {}", e)))?;
        }
        
        let migration_path = migrations_dir.join(&filename);
        let template = format!(
            "-- Migration: {}\n-- Created: {}\n\n-- Add your migration SQL here\n\n",
            name,
            Utc::now().format("%Y-%m-%d %H:%M:%S UTC")
        );
        
        fs::write(&migration_path, template)
            .map_err(|e| AppError::Database(format!("Failed to create migration file: {}", e)))?;
            
        Ok(filename)
    }
    
    /// Run all pending migrations
    pub async fn migrate(pool: &PgPool) -> AppResult<()> {
        // Create migrations table if it doesn't exist
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS _sqlx_migrations (
                version BIGINT PRIMARY KEY,
                description TEXT NOT NULL,
                installed_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                success BOOLEAN NOT NULL,
                checksum BYTEA NOT NULL,
                execution_time BIGINT NOT NULL
            )
            "#
        )
        .execute(pool)
        .await
        .map_err(|e| AppError::Database(format!("Failed to create migrations table: {}", e)))?;
        
        // Run sqlx migrate
        sqlx::migrate!("./migrations")
            .run(pool)
            .await
            .map_err(|e| AppError::Database(format!("Migration failed: {}", e)))?;
            
        println!("Migrations completed successfully");
        Ok(())
    }
    
    /// Check migration status
    pub async fn status(pool: &PgPool) -> AppResult<()> {
        // Check if migrations table exists first
        let table_exists: (bool,) = sqlx::query_as(
            r#"
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = '_sqlx_migrations'
            )
            "#
        )
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::Database(format!("Failed to check migrations table: {}", e)))?;
        
        if !table_exists.0 {
            println!("No migrations table found. Run 'migration run' to initialize.");
            return Ok(());
        }
        
        #[derive(sqlx::FromRow)]
        struct Migration {
            version: i64,
            description: String,
            installed_on: chrono::DateTime<chrono::Utc>,
            success: bool,
        }

        let migrations: Vec<Migration> = sqlx::query_as(
            "SELECT version, description, installed_on, success FROM _sqlx_migrations ORDER BY version"
        )
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::Database(format!("Failed to fetch migration status: {}", e)))?;
        
        if migrations.is_empty() {
            println!("No migrations have been run");
        } else {
            println!("Migration Status:");
            println!("{:<20} {:<30} {:<25} {:<10}", "Version", "Description", "Installed On", "Success");
            println!("{}", "-".repeat(85));
            
            for migration in migrations {
                println!(
                    "{:<20} {:<30} {:<25} {:<10}",
                    migration.version,
                    migration.description,
                    migration.installed_on.format("%Y-%m-%d %H:%M:%S"),
                    if migration.success { "✓" } else { "✗" }
                );
            }
        }
        
        Ok(())
    }
    
    /// Generate schema from models (stub for future implementation)
    pub fn generate_schema() -> AppResult<()> {
        println!("Schema generation from models is not yet implemented");
        println!("For now, please create migrations manually using: cargo run --bin migration create <name>");
        Ok(())
    }
} 