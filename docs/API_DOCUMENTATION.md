# 🚀 **Community Coin Server API Documentation**

## **Base URL**
```
Production: https://api.communitycoin.com
Development: http://localhost:8080
```

---

## 📋 **Complete API Reference**

### **🪙 1. Tokens API**

#### **Create Token**
```http
POST /api/tokens
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "DogeCoin Community",
  "symbol": "DOGEC",
  "description": "A community-driven meme token",
  "icon_url": "https://example.com/icon.png",
  "total_supply": 1000000,
  "initial_price": 0.001,
  "mint_address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "creator_pubkey": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "tx_signature": "5j7s8K9mN..."
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "DogeCoin Community",
  "symbol": "DOGEC",
  "description": "A community-driven meme token",
  "icon_url": "https://example.com/icon.png",
  "mint_address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "creator_id": "550e8400-e29b-41d4-a716-446655440001",
  "creator_pubkey": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "total_supply": 1000000,
  "circulating_supply": 1000000,
  "price": 0.001,
  "market_cap": 1000,
  "volume_24h": 0,
  "change_24h": 0,
  "is_active": true,
  "tx_signature": "5j7s8K9mN...",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### **List Tokens**
```http
GET /api/tokens?page=1&limit=20&sort=market_cap&order=desc&active=true&search=DOGE
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sort` (optional): Sort field (price, market_cap, volume_24h, created_at)
- `order` (optional): Sort order (asc, desc)
- `active` (optional): Filter by active status (true, false)
- `search` (optional): Search by name or symbol

**Response (200):**
```json
{
  "tokens": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "mint_address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      "name": "DogeCoin Community",
      "symbol": "DOGEC",
      "icon_url": "https://example.com/icon.png",
      "price": 0.001,
      "market_cap": 1000,
      "volume_24h": 150,
      "change_24h": 5.2,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "total_pages": 1
  }
}
```

#### **Get Token by ID**
```http
GET /api/tokens/{token_id}
```

**Response (200):** Same as create token response

#### **Get Token by Mint Address**
```http
GET /api/tokens/mint/{mint_address}
```

**Response (200):** Same as create token response

#### **Update Token**
```http
PUT /api/tokens/{token_id}
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Token Name",
  "description": "Updated description",
  "icon_url": "https://example.com/new-icon.png",
  "is_active": false
}
```

#### **Delete Token**
```http
DELETE /api/tokens/{token_id}
Authorization: Bearer <token>
```

**Response (204):** No content

#### **Buy Token**
```http
POST /api/tokens/{token_id}/buy
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": 1000,
  "max_price_per_token": 0.001,
  "slippage_tolerance": 1.0,
  "tx_signature": "5j7s8K9mN..."
}
```

**Response (200):**
```json
{
  "transaction_id": "550e8400-e29b-41d4-a716-446655440002",
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440003",
  "transaction_type": "buy",
  "amount": 1000,
  "price_per_token": 0.001,
  "total_value": 1.0,
  "fees": 0.01,
  "tx_signature": "5j7s8K9mN...",
  "status": "completed",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### **Sell Token**
```http
POST /api/tokens/{token_id}/sell
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": 500,
  "min_price_per_token": 0.0009,
  "slippage_tolerance": 1.0,
  "tx_signature": "5j7s8K9mN..."
}
```

#### **Get Token Market Data**
```http
GET /api/tokens/{token_id}/market
```

**Response (200):**
```json
{
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "mint_address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "current_price": 0.001,
  "market_cap": 1000,
  "volume_24h": 150,
  "change_24h": 5.2,
  "change_7d": 12.5,
  "circulating_supply": 1000000,
  "max_supply": 1000000,
  "holders_count": 25,
  "ath": 0.0015,
  "atl": 0.0008,
  "last_updated": "2024-01-15T10:30:00Z"
}
```

#### **Get Token Holdings**
```http
GET /api/tokens/{token_id}/holdings?page=1&limit=20
```

**Response (200):**
```json
{
  "holdings": [
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440003",
      "user_pubkey": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      "username": "crypto_trader_123",
      "balance": 5000,
      "value_usd": 5.0,
      "percentage": 0.5,
      "last_updated": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "total_pages": 2
  }
}
```

---

### **👤 2. Users API**

#### **Create User**
```http
POST /api/users
Content-Type: application/json
```

**Request Body:**
```json
{
  "wallet_address": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "username": "crypto_trader_123",
  "email": "user@example.com",
  "display_name": "Crypto Trader"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "wallet_address": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "username": "crypto_trader_123",
  "email": "user@example.com",
  "display_name": "Crypto Trader",
  "avatar_url": null,
  "is_verified": false,
  "total_portfolio_value": 0,
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### **Get User**
```http
GET /api/users/{user_id}
```

#### **Update User**
```http
PUT /api/users/{user_id}
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "display_name": "Updated Name",
  "avatar_url": "https://example.com/avatar.png",
  "bio": "Crypto enthusiast"
}
```

#### **Delete User**
```http
DELETE /api/users/{user_id}
Authorization: Bearer <token>
```

#### **Get User Profile**
```http
GET /api/users/{user_id}/profile
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "username": "crypto_trader_123",
  "display_name": "Crypto Trader",
  "avatar_url": "https://example.com/avatar.png",
  "bio": "Crypto enthusiast",
  "is_verified": true,
  "stats": {
    "total_portfolio_value": 1500.50,
    "tokens_owned": 5,
    "tokens_created": 2,
    "total_trades": 25,
    "join_date": "2024-01-15T10:30:00Z"
  },
  "badges": ["early_adopter", "creator"]
}
```

#### **Get User Holdings**
```http
GET /api/users/{user_id}/holdings?page=1&limit=20
```

**Response (200):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440003",
  "total_value": 1500.50,
  "holdings": [
    {
      "token_id": "550e8400-e29b-41d4-a716-446655440000",
      "token_name": "DogeCoin Community",
      "token_symbol": "DOGEC",
      "balance": 5000,
      "value_usd": 5.0,
      "current_price": 0.001,
      "change_24h": 5.2,
      "last_updated": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "total_pages": 1
  }
}
```

---

### **💸 3. Transactions API**

#### **Create Transaction**
```http
POST /api/transactions
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "type": "buy",
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 1000,
  "price_per_token": 0.001,
  "tx_signature": "5j7s8K9mN..."
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "type": "buy",
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440003",
  "amount": 1000,
  "price_per_token": 0.001,
  "total_value": 1.0,
  "tx_signature": "5j7s8K9mN...",
  "status": "pending",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### **List Transactions**
```http
GET /api/transactions?page=1&limit=20&type=buy&status=completed&token_id={token_id}
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `type`: Transaction type (buy, sell, transfer)
- `status`: Transaction status (pending, completed, failed)
- `token_id`: Filter by token
- `user_id`: Filter by user (admin only)

#### **Get Transaction**
```http
GET /api/transactions/{transaction_id}
Authorization: Bearer <token>
```

#### **Update Transaction Status**
```http
PUT /api/transactions/{transaction_id}/status
Content-Type: application/json
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "status": "completed",
  "block_hash": "5j7s8K9mN...",
  "confirmations": 32,
  "failure_reason": null
}
```

#### **Get User Transactions**
```http
GET /api/transactions/user/{user_id}?page=1&limit=20
Authorization: Bearer <token>
```

---

### **📈 4. Market Data API**

#### **Get Token Market Data**
```http
GET /api/market/tokens/{token_id}
```

**Response (200):**
```json
{
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "current_price": 0.001,
  "market_cap": 1000,
  "volume_24h": 150,
  "change_24h": 5.2,
  "change_7d": 12.5,
  "circulating_supply": 1000000,
  "max_supply": 1000000,
  "holders_count": 25,
  "ath": 0.0015,
  "atl": 0.0008,
  "last_updated": "2024-01-15T10:30:00Z"
}
```

#### **Get Price History**
```http
GET /api/market/tokens/{token_id}/price-history?interval=1h&from=2024-01-01&to=2024-01-15&limit=100
```

**Query Parameters:**
- `interval`: Time interval (1m, 5m, 15m, 1h, 4h, 1d, 1w)
- `from`: Start date (ISO 8601)
- `to`: End date (ISO 8601)
- `limit`: Maximum data points (default: 100, max: 1000)

**Response (200):**
```json
{
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "interval": "1h",
  "data": [
    {
      "timestamp": "2024-01-15T10:00:00Z",
      "open": 0.0009,
      "high": 0.0011,
      "low": 0.0008,
      "close": 0.001,
      "volume": 50
    }
  ]
}
```

#### **Get Order Book**
```http
GET /api/market/tokens/{token_id}/order-book?depth=20
```

**Query Parameters:**
- `depth`: Number of price levels to return (default: 20, max: 100)

**Response (200):**
```json
{
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "bids": [
    {
      "price": 0.0009,
      "amount": 1000,
      "total": 0.9
    }
  ],
  "asks": [
    {
      "price": 0.0011,
      "amount": 500,
      "total": 0.55
    }
  ],
  "spread": 0.0002,
  "last_updated": "2024-01-15T10:30:00Z"
}
```

#### **Get Trending Tokens**
```http
GET /api/market/trending?limit=10&timeframe=24h
```

**Query Parameters:**
- `limit`: Number of tokens (default: 10, max: 50)
- `timeframe`: Time period (1h, 24h, 7d, 30d)

**Response (200):**
```json
{
  "timeframe": "24h",
  "tokens": [
    {
      "token_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "DogeCoin Community",
      "symbol": "DOGEC",
      "price": 0.001,
      "change_24h": 25.5,
      "volume_24h": 1500,
      "market_cap": 1000,
      "rank": 1
    }
  ]
}
```

---

### **🔄 5. Trading API**

#### **Buy Tokens**
```http
POST /api/trading/buy
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 1000,
  "order_type": "market",
  "price_per_token": null,
  "slippage_tolerance": 1.0
}
```

**Response (200):**
```json
{
  "order_id": "550e8400-e29b-41d4-a716-446655440005",
  "status": "filled",
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 1000,
  "filled_amount": 1000,
  "average_price": 0.001,
  "total_cost": 1.0,
  "fees": 0.01,
  "tx_signature": "5j7s8K9mN...",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### **Sell Tokens**
```http
POST /api/trading/sell
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 500,
  "order_type": "limit",
  "price_per_token": 0.0011,
  "slippage_tolerance": 1.0
}
```

#### **Get User Portfolio**
```http
GET /api/trading/portfolio/{user_id}
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440003",
  "total_value": 1500.50,
  "total_cost_basis": 1200.00,
  "unrealized_pnl": 300.50,
  "realized_pnl": 50.25,
  "holdings": [
    {
      "token_id": "550e8400-e29b-41d4-a716-446655440000",
      "token_name": "DogeCoin Community",
      "token_symbol": "DOGEC",
      "balance": 5000,
      "average_cost": 0.0008,
      "current_price": 0.001,
      "value_usd": 5.0,
      "unrealized_pnl": 1.0,
      "pnl_percentage": 25.0
    }
  ],
  "last_updated": "2024-01-15T10:30:00Z"
}
```

---

### **🔔 6. Notifications API**

#### **List Notifications**
```http
GET /api/notifications?page=1&limit=20&read=false&type=trade
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `read`: Filter by read status (true, false)
- `type`: Notification type (trade, price_alert, system)

**Response (200):**
```json
{
  "notifications": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440006",
      "type": "trade",
      "title": "Trade Executed",
      "message": "Your buy order for 1000 DOGEC has been filled",
      "data": {
        "token_id": "550e8400-e29b-41d4-a716-446655440000",
        "amount": 1000,
        "price": 0.001
      },
      "is_read": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "total_pages": 1
  }
}
```

#### **Mark as Read**
```http
PUT /api/notifications/{notification_id}
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440006",
  "is_read": true,
  "read_at": "2024-01-15T10:35:00Z"
}
```

#### **Get Unread Count**
```http
GET /api/notifications/unread-count
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "unread_count": 3
}
```

---

### **📊 7. Analytics API**

#### **Get Token Analytics**
```http
GET /api/analytics/tokens/{token_id}?timeframe=7d
```

**Query Parameters:**
- `timeframe`: Time period (1h, 24h, 7d, 30d)

**Response (200):**
```json
{
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "timeframe": "7d",
  "metrics": {
    "price_change": 12.5,
    "volume_change": 25.0,
    "holder_change": 5,
    "trade_count": 150,
    "unique_traders": 25,
    "avg_trade_size": 1000,
    "volatility": 15.2
  },
  "top_holders": [
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440003",
      "balance": 50000,
      "percentage": 5.0
    }
  ]
}
```

#### **Get User Analytics**
```http
GET /api/analytics/user/{user_id}?timeframe=30d
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440003",
  "timeframe": "30d",
  "metrics": {
    "total_trades": 25,
    "total_volume": 5000,
    "realized_pnl": 250.50,
    "win_rate": 68.0,
    "avg_holding_time": "5d 12h",
    "favorite_tokens": ["DOGEC", "CATC", "MOONC"]
  },
  "portfolio_performance": {
    "start_value": 1000,
    "end_value": 1500.50,
    "total_return": 50.05,
    "best_trade": 125.50,
    "worst_trade": -45.20
  }
}
```

#### **Get Market Analytics**
```http
GET /api/analytics/market?timeframe=24h
```

**Response (200):**
```json
{
  "timeframe": "24h",
  "metrics": {
    "total_volume": 50000,
    "total_trades": 1250,
    "active_tokens": 150,
    "new_tokens": 5,
    "top_gainers": [
      {
        "token_id": "550e8400-e29b-41d4-a716-446655440000",
        "symbol": "DOGEC",
        "change_24h": 45.2
      }
    ],
    "top_losers": [
      {
        "token_id": "550e8400-e29b-41d4-a716-446655440001",
        "symbol": "CATC",
        "change_24h": -15.8
      }
    ]
  }
}
```

---

### **🌐 8. WebSocket API**

#### **Connect to WebSocket**
```javascript
const ws = new WebSocket('wss://api.communitycoin.com/ws');

// Subscribe to channels
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'market-data',
  token_id: '550e8400-e29b-41d4-a716-446655440000'
}));
```

#### **Available Channels:**

**Market Data Channel:**
```javascript
// Subscribe
{
  "type": "subscribe",
  "channel": "market-data",
  "token_id": "550e8400-e29b-41d4-a716-446655440000"
}

// Receive updates
{
  "channel": "market-data",
  "data": {
    "token_id": "550e8400-e29b-41d4-a716-446655440000",
    "price": 0.001,
    "change_24h": 5.2,
    "volume_24h": 150,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Transaction Channel:**
```javascript
// Subscribe to user transactions
{
  "type": "subscribe",
  "channel": "transactions",
  "user_id": "550e8400-e29b-41d4-a716-446655440003"
}

// Receive updates
{
  "channel": "transactions",
  "data": {
    "transaction_id": "550e8400-e29b-41d4-a716-446655440004",
    "type": "buy",
    "status": "completed",
    "amount": 1000,
    "token_symbol": "DOGEC"
  }
}
```

**Notifications Channel:**
```javascript
// Subscribe to user notifications
{
  "type": "subscribe",
  "channel": "notifications",
  "user_id": "550e8400-e29b-41d4-a716-446655440003"
}

// Receive notifications
{
  "channel": "notifications",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440006",
    "type": "trade",
    "title": "Trade Executed",
    "message": "Your buy order has been filled"
  }
}
```

---

### **🏥 9. Health & Monitoring API**

#### **General Health Check**
```http
GET /health
```

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "uptime": "5d 12h 30m",
  "environment": "production"
}
```

#### **Database Health**
```http
GET /health/db
```

**Response (200):**
```json
{
  "status": "healthy",
  "connection_pool": {
    "active": 5,
    "idle": 15,
    "max": 20
  },
  "query_time_ms": 2.5,
  "last_migration": "2024-01-15T10:00:00Z"
}
```

#### **Redis Health**
```http
GET /health/redis
```

**Response (200):**
```json
{
  "status": "healthy",
  "connection_count": 10,
  "memory_usage": "45MB",
  "hit_rate": 95.2
}
```

#### **Solana Health**
```http
GET /health/solana
```

**Response (200):**
```json
{
  "status": "healthy",
  "rpc_url": "https://api.devnet.solana.com",
  "block_height": 245123456,
  "response_time_ms": 150
}
```

#### **Prometheus Metrics**
```http
GET /metrics
```

**Response (200):** Prometheus-formatted metrics

---

## 🔐 **Authentication**

### **API Key Authentication**
```http
Authorization: Bearer your-api-key-here
```

### **Wallet Signature Authentication**
```http
Authorization: Signature wallet=9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM,signature=5j7s8K9mN...,message=auth-message
```

---

## ⚠️ **Error Responses**

### **Standard Error Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### **Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `429` - Rate Limited
- `500` - Internal Server Error

---

## 🚀 **Frontend Integration Examples**

### **React Integration:**
```typescript
// api/tokenApi.ts
import { api } from './client';

export interface Token {
  id: string;
  name: string;
  symbol: string;
  price: number;
  market_cap: number;
  change_24h: number;
}

export const tokenApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) => 
    api.get<{ tokens: Token[]; pagination: any }>('/api/tokens', { params }),
    
  get: (id: string) => 
    api.get<Token>(`/api/tokens/${id}`),
    
  create: (data: CreateTokenRequest) => 
    api.post<Token>('/api/tokens', data),
    
  buy: (tokenId: string, amount: number, txSignature: string) =>
    api.post(`/api/tokens/${tokenId}/buy`, { amount, tx_signature: txSignature }),
    
  getMarketData: (tokenId: string) =>
    api.get(`/api/tokens/${tokenId}/market`)
};

// components/TokenList.tsx
import { useEffect, useState } from 'react';
import { tokenApi, Token } from '../api/tokenApi';

export const TokenList = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await tokenApi.list({ limit: 20 });
        setTokens(response.tokens);
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {tokens.map(token => (
        <div key={token.id}>
          <h3>{token.name} ({token.symbol})</h3>
          <p>Price: ${token.price}</p>
          <p>Change: {token.change_24h}%</p>
        </div>
      ))}
    </div>
  );
};
```

### **WebSocket Integration:**
```typescript
// hooks/useWebSocket.ts
import { useEffect, useState } from 'react';

export const useMarketData = (tokenId: string) => {
  const [marketData, setMarketData] = useState(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const websocket = new WebSocket('wss://api.communitycoin.com/ws');
    
    websocket.onopen = () => {
      websocket.send(JSON.stringify({
        type: 'subscribe',
        channel: 'market-data',
        token_id: tokenId
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.channel === 'market-data') {
        setMarketData(data.data);
      }
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [tokenId]);

  return marketData;
};
```

---

## 📝 **Rate Limiting**

- **General API**: 100 requests per minute per IP
- **Market Data**: 200 requests per minute per IP
- **WebSocket**: 50 connections per IP
- **Authentication**: 10 login attempts per minute per IP

---

## 🔧 **Pagination**

All list endpoints support pagination with consistent parameters:
- `page`: Page number (starts at 1)
- `limit`: Items per page (max 100)
- Response includes `pagination` object with `total`, `total_pages`, etc.

---

## 📊 **Caching**

- **Market Data**: Cached for 30 seconds
- **Price History**: Cached for 1-15 minutes based on interval
- **User Data**: Cached for 5 minutes
- **Token Metadata**: Cached for 1 hour 