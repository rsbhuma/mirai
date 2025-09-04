# 🦀 Server Development Setup (Local - No Docker)

This guide explains how to set up the Rust server (`server_rust`) for local development on your laptop without using Docker.

## 📋 Prerequisites

### Required Software
- **Rust** (latest stable version)
- **PostgreSQL** (version 15+)
- **Redis** (version 7+)
- **Git**

### Installation Commands

#### Ubuntu/Debian
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Install Redis
sudo apt install redis-server

# Install development tools
sudo apt install build-essential pkg-config libssl-dev
```

#### macOS
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install PostgreSQL and Redis via Homebrew
brew install postgresql@15 redis

# Start services
brew services start postgresql@15
brew services start redis
```

## 🗄️ Database Setup

### 1. Start PostgreSQL Service
```bash
# Ubuntu/Debian
sudo systemctl start postgresql
sudo systemctl enable postgresql

# macOS (if not using brew services)
pg_ctl -D /usr/local/var/postgres start
```

### 2. Create Database and User
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE community_coin_db;
CREATE USER postgres WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE community_coin_db TO postgres;
\q
```

### 3. Run Database Migrations
```bash
cd server_rust

# Install sqlx CLI (if not already installed)
cargo install sqlx-cli --no-default-features --features native-tls,postgres

# Run migrations
sqlx migrate run --database-url "postgresql://postgres:password@localhost:5432/community_coin_db"
```

## 🔧 Redis Setup

### 1. Start Redis Service
```bash
# Ubuntu/Debian
sudo systemctl start redis-server
sudo systemctl enable redis-server

# macOS
redis-server /usr/local/etc/redis.conf

# Or if using brew services
brew services start redis
```

### 2. Verify Redis is Running
```bash
redis-cli ping
# Should return: PONG
```

## 🚀 Server Setup

### 1. Clone and Navigate
```bash
git clone <your-repo>
cd community_coin_server/server_rust
```

### 2. Install Dependencies
```bash
# This will download and compile all Rust dependencies
cargo build
```

### 3. Set Environment Variables
Create a `.env` file in the `server_rust` directory:

```bash
# server_rust/.env
PORT=8080
DATABASE_URL=postgresql://postgres:password@localhost:5432/community_coin_db
REDIS_URL=redis://localhost:6379
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com
JWT_SECRET=your-jwt-secret-key-make-it-long-and-secure
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
COMMCOIN_PROGRAM_ID=6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX
ENVIRONMENT=development
LOG_LEVEL=info
```

### 4. Build and Run
```bash
# Development build (faster compilation, includes debug info)
cargo run

# Or for production build (optimized, slower compilation)
cargo build --release
./target/release/server_rust
```

## ✅ Verification

### 1. Health Check
```bash
curl http://localhost:8080/health
# Should return: {"status":"healthy","checks":{"database":"healthy","redis":"healthy","solana":"healthy"}}
```

### 2. API Endpoints
```bash
# Test user endpoints
curl http://localhost:8080/api/users

# Test token endpoints  
curl http://localhost:8080/api/tokens

# Test market data
curl http://localhost:8080/api/market/overview
```

### 3. WebSocket Connection
```bash
# Install wscat if not available
npm install -g wscat

# Test WebSocket
wscat -c ws://localhost:8080/ws
```

## 🔄 Development Workflow

### Hot Reload Development
```bash
# Install cargo-watch for auto-reload
cargo install cargo-watch

# Run with auto-reload on file changes
cargo watch -x run
```

### Database Operations
```bash
# Reset database (drops and recreates)
sqlx database drop --database-url "postgresql://postgres:password@localhost:5432/community_coin_db"
sqlx database create --database-url "postgresql://postgres:password@localhost:5432/community_coin_db"
sqlx migrate run --database-url "postgresql://postgres:password@localhost:5432/community_coin_db"

# Create new migration
sqlx migrate add <migration_name>
```

### Testing
```bash
# Run unit tests
cargo test

# Run with output
cargo test -- --nocapture

# Run specific test
cargo test test_name
```

## 🐛 Troubleshooting

### Common Issues

#### "Connection refused" for PostgreSQL
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo journalctl -u postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### "Connection refused" for Redis
```bash
# Check if Redis is running
sudo systemctl status redis-server

# Start Redis manually
redis-server

# Check Redis configuration
redis-cli config get "*"
```

#### Compilation Errors
```bash
# Update Rust toolchain
rustup update

# Clean build cache
cargo clean
cargo build

# Install missing system dependencies
sudo apt install build-essential pkg-config libssl-dev
```

#### Database Migration Errors
```bash
# Check database connection
psql -h localhost -U postgres -d community_coin_db

# Manually run SQL files
psql -h localhost -U postgres -d community_coin_db -f migrations/xxxx_migration.sql
```

## 📊 Available Features

The server provides **78+ API endpoints** across these categories:

- **Authentication** (4 endpoints) - Wallet-based login/logout
- **User Management** (13 endpoints) - User profiles, following, portfolios
- **Token Management** (10 endpoints) - Token CRUD, statistics, search
- **Trading** (6 endpoints) - Buy/sell orders, quotes, order management
- **Market Data** (8 endpoints) - Price data, charts, orderbooks
- **Social Features** (10 endpoints) - Posts, comments, likes, challenges
- **Transactions** (8 endpoints) - Transaction history and management
- **Notifications** (6 endpoints) - User notifications and preferences
- **Analytics** (8 endpoints) - Platform analytics and insights
- **WebSocket** (7 endpoints) - Real-time communication

## 🔗 Integration Points

- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis for session management and caching
- **Blockchain**: Solana RPC integration (configurable endpoint)
- **Authentication**: Custom JWT + Supabase integration
- **Real-time**: WebSocket connections for live updates
- **Monitoring**: Prometheus metrics endpoint

## 📝 Next Steps

1. **Set up the client**: See `docs/CLIENT_DEVELOPMENT_SETUP.md`
2. **Set up contracts**: See `docs/CONTRACTS_DEVELOPMENT_SETUP.md`
3. **Full E2E testing**: Use `scripts/setup-localnet-e2e.sh`
4. **Production deployment**: See `docs/MULTI_CLOUD_DEPLOYMENT.md`

---

💡 **Tip**: For the complete development experience with Solana localnet, use the E2E setup script which handles everything automatically. 