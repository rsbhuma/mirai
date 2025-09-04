# WebSocket and Transaction Listening Configuration

## Overview

This document describes the scalable WebSocket architecture for the Community Coin server, which includes:

1. **Transaction Listener** - Listens to Solana RPC for blockchain transactions
2. **WebSocket Manager** - Handles client connections and message routing
3. **Message Broker** - Enables scalable messaging across multiple server instances
4. **Connection Manager** - Manages WebSocket connections with proper cleanup

## Architecture Components

### 1. Transaction Listener (`transaction_listener.rs`)

The transaction listener connects to Solana RPC endpoints and listens for:
- Program-specific transactions (CommCoin program)
- Token transactions (SPL Token program)
- Account-specific transactions

**Features:**
- Real-time transaction monitoring
- Automatic reconnection on failure
- Transaction parsing and filtering
- WebSocket message broadcasting

**Configuration:**
```bash
# Enable/disable transaction listener
TRANSACTION_LISTENER_ENABLED=true

# Solana RPC endpoints
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WS_URL=wss://api.mainnet-beta.solana.com

# Program ID to monitor
COMMCOIN_PROGRAM_ID=6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX
```

### 2. WebSocket Manager (`manager.rs`)

Handles WebSocket connections and message routing.

**Features:**
- Connection management
- Message broadcasting
- User-specific messaging
- Topic-based subscriptions
- Connection statistics

**Configuration:**
```bash
# WebSocket settings
WEBSOCKET_MAX_CONNECTIONS=10000
WEBSOCKET_HEARTBEAT_INTERVAL=30

# Server identification
SERVER_ID=server-1
```

### 3. Message Broker (`message_broker.rs`)

Enables scalable messaging across multiple server instances using Redis pub/sub.

**Features:**
- Cross-server message broadcasting
- Server discovery and health monitoring
- Message routing and targeting
- Redis-based pub/sub

**Configuration:**
```bash
# Enable/disable message broker
MESSAGE_BROKER_ENABLED=true

# Redis configuration
REDIS_URL=redis://localhost:6379

# Server identification
SERVER_ID=server-1
```

### 4. Connection Manager (`connection_manager.rs`)

Manages WebSocket connections with advanced features.

**Features:**
- Connection tracking and statistics
- Automatic cleanup of stale connections
- User and subscription mapping
- Connection metadata storage

## Deployment Configuration

### Single Server Deployment

For a single server setup, you can disable the message broker:

```bash
export MESSAGE_BROKER_ENABLED=false
export TRANSACTION_LISTENER_ENABLED=true
export WEBSOCKET_MAX_CONNECTIONS=1000
export SERVER_ID=server-1
```

### Multi-Server Deployment

For scalable deployment across multiple servers:

```bash
# Server 1
export SERVER_ID=server-1
export MESSAGE_BROKER_ENABLED=true
export TRANSACTION_LISTENER_ENABLED=true
export REDIS_URL=redis://redis-cluster:6379

# Server 2
export SERVER_ID=server-2
export MESSAGE_BROKER_ENABLED=true
export TRANSACTION_LISTENER_ENABLED=false  # Only one server needs to listen
export REDIS_URL=redis://redis-cluster:6379
```

### AWS/Cloud Deployment

For cloud deployment, consider:

1. **Load Balancer**: Use AWS ALB or similar for WebSocket connections
2. **Redis Cluster**: Use ElastiCache for Redis pub/sub
3. **Auto Scaling**: Scale based on WebSocket connection count
4. **Health Checks**: Monitor server health and connection stats

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_ID` | auto-generated | Unique server identifier |
| `WEBSOCKET_MAX_CONNECTIONS` | 10000 | Maximum WebSocket connections |
| `WEBSOCKET_HEARTBEAT_INTERVAL` | 30 | Heartbeat interval in seconds |
| `TRANSACTION_LISTENER_ENABLED` | true | Enable transaction listening |
| `MESSAGE_BROKER_ENABLED` | true | Enable message broker |
| `SOLANA_RPC_URL` | localhost:8899 | Solana RPC endpoint |
| `SOLANA_WS_URL` | localhost:8900 | Solana WebSocket endpoint |
| `REDIS_URL` | localhost:6379 | Redis connection URL |
| `COMMCOIN_PROGRAM_ID` | 6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX | Program ID to monitor |

## WebSocket Client Connection

Clients can connect to the WebSocket endpoint:

```javascript
// Basic connection
const ws = new WebSocket('ws://localhost:8080/ws');

// With user ID and subscriptions
const ws = new WebSocket('ws://localhost:8080/ws?user_id=123&subscriptions=token_updates,transactions');

// Send subscription message
ws.send(JSON.stringify({
    type: 'subscribe',
    data: { topic: 'market_data' }
}));

// Handle incoming messages
ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('Received:', message);
};
```

## Message Types

The system supports various message types:

1. **TokenCreated** - New token creation events
2. **TokenPriceUpdate** - Token price changes
3. **TransactionUpdate** - Transaction status updates
4. **MarketData** - Market data updates
5. **Notification** - User notifications
6. **UserActivity** - User activity events

## Monitoring and Metrics

The system provides connection statistics via API:

```bash
# Get connection stats
curl http://localhost:8080/api/ws/connections

# Response:
{
    "total_connections": 150,
    "active_users": 120,
    "subscriptions": 450,
    "server_id": "server-1"
}
```

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server is running
   - Verify REDIS_URL configuration
   - Check network connectivity

2. **Solana RPC Connection Failed**
   - Verify SOLANA_RPC_URL is accessible
   - Check rate limits on public RPC endpoints
   - Consider using a dedicated RPC provider

3. **WebSocket Connection Limits**
   - Increase WEBSOCKET_MAX_CONNECTIONS
   - Monitor server resources
   - Consider load balancing

4. **Message Broker Issues**
   - Check Redis pub/sub functionality
   - Verify server discovery is working
   - Monitor server heartbeats

### Logs

Enable debug logging for troubleshooting:

```bash
export LOG_LEVEL=debug
export RUST_LOG=websocket=debug,transaction_listener=debug
```

## Performance Considerations

1. **Connection Limits**: Monitor connection count and adjust limits
2. **Message Rate**: Implement rate limiting for message broadcasting
3. **Memory Usage**: Monitor memory usage with large connection counts
4. **Network**: Use appropriate network configuration for WebSocket traffic
5. **Redis**: Monitor Redis performance and consider clustering for high load 