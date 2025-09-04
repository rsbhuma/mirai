# Self-Hosted Community Coin Server Setup

This guide explains how to run the Community Coin server completely self-hosted without any external dependencies like Supabase.

## 🔐 Authentication (Self-Hosted JWT)

### ✅ What We Use Instead of Supabase
- **JWT tokens** generated and validated locally
- **Redis** for session storage
- **PostgreSQL** for user data
- **Wallet signature verification** for authentication

### Configuration

Add these environment variables to your `server_rust/.env` file:

```bash
# JWT Configuration (Self-hosted authentication)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY_HOURS=24

# Database (for user storage)
DATABASE_URL=postgresql://postgres:password@localhost:5433/community_coin_db

# Redis (for session storage)
REDIS_URL=redis://localhost:6379
```

### How It Works

1. **User Login**: Client sends wallet address + signature
2. **Signature Verification**: Server verifies the wallet signature
3. **JWT Generation**: Server creates a JWT token with user info
4. **Session Storage**: Session stored in Redis for fast access
5. **Token Validation**: All API requests validate JWT tokens

### Benefits vs Supabase
- ✅ **No external dependencies**
- ✅ **Full control over authentication**
- ✅ **No monthly costs**
- ✅ **Better privacy** (data stays on your servers)
- ✅ **Custom wallet-based authentication**

## 🌐 Solana RPC Configuration

### ✅ RPC Provider Options (Priority Order)

1. **Helius API** (Best performance, enhanced features)
2. **Custom RPC** (Your own Solana RPC endpoint)
3. **Local Validator** (Development/testing)

### Option 1: Helius API (Recommended for Production)

**Benefits:**
- Enhanced transaction parsing
- Better rate limits
- Real-time WebSocket subscriptions
- Reliable infrastructure

**Setup:**
```bash
# Get free API key from https://www.helius.dev/
HELIUS_API_KEY=your_helius_api_key_here
```

**Cost:** Free tier available, paid plans for production

### Option 2: Custom RPC Endpoint

**Benefits:**
- Full control over infrastructure
- No external dependencies
- Custom rate limits

**Setup:**
```bash
# Use any Solana RPC endpoint
SOLANA_RPC_URL=https://your-solana-rpc-endpoint.com
SOLANA_WS_URL=wss://your-solana-websocket-endpoint.com
```

**Examples:**
- Public RPC: `https://api.mainnet-beta.solana.com`
- GenesysGo: `https://ssc-dao.genesysgo.net`
- Triton: `https://solana-api.tt-prod.net`

### Option 3: Local Validator (Development)

**Benefits:**
- Complete control
- No rate limits
- Fast development

**Setup:**
```bash
# Default for local development
SOLANA_RPC_URL=http://localhost:8899
SOLANA_WS_URL=ws://localhost:8900
```

**Start local validator:**
```bash
solana-test-validator
```

## 🚀 Complete Environment Configuration

Create `server_rust/.env` with all settings:

```bash
# Server Configuration
PORT=8080
ENVIRONMENT=production
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5433/community_coin_db
DATABASE_READ_URLS=postgresql://postgres:password@localhost:5433/community_coin_db

# Redis
REDIS_URL=redis://localhost:6379

# Authentication (Self-hosted JWT)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-minimum-32-chars
JWT_EXPIRY_HOURS=24

# Solana RPC (Choose one option)
# Option 1: Helius API (Recommended)
HELIUS_API_KEY=your_helius_api_key_here

# Option 2: Custom RPC (Alternative)
# SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# SOLANA_WS_URL=wss://api.mainnet-beta.solana.com

# Option 3: Local Validator (Development)
# SOLANA_RPC_URL=http://localhost:8899
# SOLANA_WS_URL=ws://localhost:8900

# Smart Contract
COMMCOIN_PROGRAM_ID=6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX
```

## 🔧 Setup Steps

### 1. Database Setup
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb community_coin_db

# Run migrations
cd server_rust
sqlx migrate run
```

### 2. Redis Setup
```bash
# Install Redis
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 3. Helius API Setup (Optional)
```bash
# Run the setup script
cd server_rust
python3 ../docs/setup_helius.py
```

### 4. Server Setup
```bash
# Build and run
cd server_rust
cargo build --release
cargo run
```

## 📊 Monitoring

When you start the server, you'll see which configuration is being used:

```
INFO community_coin_server: 🔗 Using RPC Provider: Helius API
INFO community_coin_server: 🌐 RPC URL: https://mainnet.helius-rpc.com/v0/your_api_key
INFO community_coin_server: ✅ Solana client connected successfully
```

## 🛡️ Security Considerations

### JWT Secret
- Use a strong, random secret (minimum 32 characters)
- Never commit secrets to version control
- Rotate secrets regularly in production

### Database Security
- Use strong passwords
- Enable SSL connections in production
- Restrict database access to application servers only

### Redis Security
- Enable authentication (`requirepass`)
- Use SSL/TLS in production
- Restrict network access

## 🔄 Migration from Supabase

If you were previously using Supabase:

1. **Export user data** from Supabase
2. **Import users** into PostgreSQL
3. **Update environment variables** (remove Supabase, add JWT)
4. **Test authentication** with wallet signatures
5. **Update client** to use new JWT endpoints

## 🧪 Testing

### Test Authentication
```bash
# Login with wallet
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "your_wallet_address",
    "signature": "signature_from_wallet",
    "message": "Login to Community Coin"
  }'
```

### Test RPC Connection
```bash
# Check server health
curl http://localhost:8080/health

# The response will show which RPC provider is being used
```

## 📈 Production Deployment

### Docker Compose Example
```yaml
version: '3.8'
services:
  server:
    build: .
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - HELIUS_API_KEY=${HELIUS_API_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
      
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=community_coin_db
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 🎯 Summary

✅ **No Supabase needed** - Self-hosted JWT authentication  
✅ **Flexible RPC options** - Helius, custom, or local  
✅ **Complete control** - All data on your infrastructure  
✅ **Cost effective** - No monthly SaaS fees  
✅ **Production ready** - Scalable and secure  

Your server is now completely self-hosted! 🚀 