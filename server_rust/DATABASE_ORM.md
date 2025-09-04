# Database ORM and Migration System

This project uses SQLx as an ORM with a custom migration management system that keeps the database schema in sync with the Rust models.

## Migration Commands

### Create a new migration
```bash
cargo run --bin migration create "add_user_preferences"
```

### Run all pending migrations
```bash
cargo run --bin migration run
```

### Check migration status
```bash
cargo run --bin migration status
```

### Generate schema from models (coming soon)
```bash
cargo run --bin migration generate
```


[09:27, 8/3/2025] Vin: cargo run --bin community_coin_server, cargo run --bin migrations
[09:28, 8/3/2025] Vin: try running migrations and see if issue with posts fixed
[09:29, 8/3/2025] Vin: cargo run --bin migrations run


## How it Works

1. **Models**: Define your data structures in `src/models/`
2. **Migrations**: SQL files in `migrations/` directory that modify the database schema
3. **Repositories**: Database access layer in `src/database/repositories.rs`

## Migration File Structure

Migration files are named with a timestamp and description:
```
20241201000001_update_users_table.sql
```

Each migration file contains SQL to modify the database schema:
```sql
-- Migration: Add user preferences
-- Created: 2024-12-01 12:00:00 UTC

-- Add your migration SQL here
ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';
```

## Best Practices

1. **Always create migrations for schema changes** - Never modify the database directly
2. **Make migrations reversible when possible** - Include DROP statements for rollbacks
3. **Test migrations thoroughly** - Run them on a copy of production data first
4. **Keep migrations atomic** - Each migration should do one logical change

## Database Models

The following models are currently defined:

- `User` - User accounts and profiles
- `Token` - Community tokens
- `Transaction` - Trading transactions
- `Post` - Social media posts
- `Discussion` - Token discussions
- `Challenge` - Community challenges
- `Reward` - User rewards

## Environment Variables

Make sure to set the database URL:
```bash
export DATABASE_URL="postgresql://user:password@localhost/community_coin"
```

## Examples

### Creating a user with wallet login
```rust
use crate::database::repositories::UserRepository;

let user = UserRepository::get_by_wallet_address(pool, wallet_address).await?;
let user = match user {
    Some(user) => user,
    None => UserRepository::create(pool, wallet_address).await?,
};
```

### Running migrations on startup
```rust
use crate::database::MigrationManager;

// Run migrations on server startup
MigrationManager::migrate(&pool).await?;
``` 