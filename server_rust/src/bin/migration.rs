use clap::{Arg, Command};
use std::env;
use community_coin_server::database::{DatabaseManager, MigrationManager};
use community_coin_server::config::Config;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let matches = Command::new("migration")
        .about("Database migration management tool")
        .subcommand(
            Command::new("create")
                .about("Create a new migration file")
                .arg(
                    Arg::new("name")
                        .help("The name of the migration")
                        .required(true)
                        .value_name("NAME")
                )
        )
        .subcommand(
            Command::new("run")
                .about("Run all pending migrations")
        )
        .subcommand(
            Command::new("status")
                .about("Show migration status")
        )
        .subcommand(
            Command::new("generate")
                .about("Generate schema from models (coming soon)")
        )
        .get_matches();

    match matches.subcommand() {
        Some(("create", sub_matches)) => {
            let name = sub_matches.get_one::<String>("name").unwrap();
            match MigrationManager::create_migration(name) {
                Ok(filename) => println!("Created migration: {}", filename),
                Err(e) => eprintln!("Error creating migration: {}", e),
            }
        }
        Some(("run", _)) => {
            let config = Config::from_env()?;
            let db = DatabaseManager::new(&config.database_url, config.database_read_urls).await?;
            
            match MigrationManager::migrate(db.get_pool()).await {
                Ok(_) => println!("Migrations completed successfully"),
                Err(e) => eprintln!("Migration failed: {}", e),
            }
        }
        Some(("status", _)) => {
            let config = Config::from_env()?;
            let db = DatabaseManager::new(&config.database_url, config.database_read_urls).await?;
            
            match MigrationManager::status(db.get_pool()).await {
                Ok(_) => {},
                Err(e) => eprintln!("Failed to get migration status: {}", e),
            }
        }
        Some(("generate", _)) => {
            match MigrationManager::generate_schema() {
                Ok(_) => {},
                Err(e) => eprintln!("Schema generation failed: {}", e),
            }
        }
        _ => {
            println!("No subcommand provided. Use --help for usage information.");
        }
    }

    Ok(())
} 