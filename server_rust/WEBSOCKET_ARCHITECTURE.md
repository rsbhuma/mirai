# WebSocket and Transaction Listening Architecture

## Overview

This document describes the scalable WebSocket architecture implemented for the Community Coin server. The system provides real-time communication between clients and the server, with support for blockchain transaction monitoring and scalable deployment across multiple server instances.

## Architecture Components

### 1. Core Components

#### WebSocket Manager (`websocket/manager.rs`)
- **Purpose**: Manages WebSocket connections and message routing
- **Features**:
  - Connection lifecycle management
  - Message broadcasting to all clients
  - User-specific message delivery
  - Topic-based subscriptions
  - Connection statistics and monitoring

#### Transaction Listener (`websocket/transaction_listener.rs`)
- **Purpose**: Listens to Solana blockchain for relevant transactions
- **Features**:
  - Real-time transaction monitoring via Solana WebSocket
  - Program-specific transaction filtering
  - Token transaction monitoring
  - Account-specific transaction tracking
  - Automatic reconnection on failure

#### Message Broker (`websocket/message_broker.rs`)
- **Purpose**: Enables scalable messaging across multiple server instances
- **Features**:
  - Redis-based pub/sub for cross-server communication
  - Server discovery and health monitoring
  - Message routing and targeting
  - Heartbeat mechanism for server health

#### Connection Manager (`websocket/connection_manager.rs`)
- **Purpose**: Advanced connection management with cleanup
- **Features**:
  - Connection tracking with metadata
  - Automatic cleanup of stale connections
  - User and subscription mapping
  - Connection statistics and monitoring

### 2. Message Types

The system supports various message types for different use cases:

```rust
pub enum WebSocketMessage {
    TokenCreated {
        token_id: Uuid,
        name: String,
        symbol: String,
        creator: String,
    },
    TokenPriceUpdate {
        token_id: Uuid,
        price: Decimal,
        change_24h: Decimal,
    },
    TransactionUpdate {
        transaction_id: Uuid,
        status: String,
        user_id: Uuid,
    },
    MarketData {
        token_id: Uuid,
        price: Decimal,
        volume_24h: Decimal,
        market_cap: Decimal,
    },
    Notification {
        user_id: Uuid,
        title: String,
        message: String,
        notification_type: String,
    },
    UserActivity {
        user_id: Uuid,
        activity_type: String,
        data: serde_json::Value,
    },
}
```

## Scalability Features

### 1. Multi-Server Support

The architecture supports horizontal scaling across multiple server instances:

```bash
# Server 1 (Primary)
SERVER_ID=server-1
MESSAGE_BROKER_ENABLED=true
TRANSACTION_LISTENER_ENABLED=true

# Server 2 (Secondary)
SERVER_ID=server-2
MESSAGE_BROKER_ENABLED=true
TRANSACTION_LISTENER_ENABLED=false
```

### 2. Redis Pub/Sub

Messages are distributed across servers using Redis pub/sub:

- **Channel**: `websocket_messages`
- **Message Format**: JSON with routing information
- **Targeting**: Support for user-specific, topic-specific, and server-specific routing

### 3. Connection Management

- **Maximum Connections**: Configurable per server (default: 10,000)
- **Heartbeat**: Configurable interval (default: 30 seconds)
- **Cleanup**: Automatic removal of stale connections
- **Statistics**: Real-time connection monitoring

## Configuration

### Environment Variables

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

### Deployment Scenarios

#### Single Server
```bash
export MESSAGE_BROKER_ENABLED=false
export TRANSACTION_LISTENER_ENABLED=true
export WEBSOCKET_MAX_CONNECTIONS=1000
```

#### Multi-Server (AWS/Cloud)
```bash
# Load balancer configuration
# Redis cluster (ElastiCache)
# Auto-scaling based on connection count
# Health checks and monitoring
```

## API Endpoints

### WebSocket Endpoint
```
GET /ws?user_id=<id>&subscriptions=<topics>
```

### REST Endpoints
```
GET  /api/ws/connections     # Get connection statistics
POST /api/ws/broadcast       # Broadcast message to clients
```

## Client Integration

### JavaScript Example
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8080/ws?user_id=123&subscriptions=market-data');

// Send subscription
ws.send(JSON.stringify({
    type: 'subscribe',
    data: { topic: 'token_updates' }
}));

// Handle messages
ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('Received:', message);
};
```

## Transaction Monitoring

### Supported Transaction Types

1. **Program Transactions**: Monitor CommCoin program interactions
2. **Token Transactions**: Monitor SPL token program activities
3. **Account Transactions**: Monitor specific account activities

### Transaction Processing

1. **Subscription**: Connect to Solana WebSocket for transaction logs
2. **Filtering**: Filter transactions by program ID, accounts, or instructions
3. **Parsing**: Extract relevant data from transaction logs
4. **Broadcasting**: Send processed data to subscribed clients

## Performance Considerations

### 1. Connection Limits
- Monitor connection count and adjust limits based on server resources
- Implement connection pooling for high-traffic scenarios

### 2. Message Rate Limiting
- Implement rate limiting for message broadcasting
- Use batching for high-frequency updates

### 3. Memory Management
- Monitor memory usage with large connection counts
- Implement connection cleanup and garbage collection

### 4. Network Optimization
- Use appropriate WebSocket compression
- Implement connection keep-alive mechanisms

## Monitoring and Observability

### 1. Connection Statistics
```json
{
    "total_connections": 150,
    "active_users": 120,
    "subscriptions": 450,
    "server_id": "server-1"
}
```

### 2. Health Checks
- Server health monitoring via heartbeat
- Redis connection status
- Solana RPC connection status

### 3. Logging
- Structured logging with different levels
- Transaction monitoring logs
- Connection lifecycle logs

## Security Considerations

### 1. Authentication
- JWT-based authentication for WebSocket connections
- User-specific message routing

### 2. Rate Limiting
- Connection rate limiting
- Message rate limiting per user

### 3. Input Validation
- Validate all incoming WebSocket messages
- Sanitize user inputs

## Testing

### 1. Unit Tests
- Individual component testing
- Mock WebSocket connections
- Transaction parsing tests

### 2. Integration Tests
- End-to-end WebSocket communication
- Multi-server message routing
- Transaction monitoring tests

### 3. Load Testing
- High connection count testing
- Message throughput testing
- Memory usage testing

## Deployment Checklist

### Pre-deployment
- [ ] Configure environment variables
- [ ] Set up Redis cluster (for multi-server)
- [ ] Configure load balancer (for multi-server)
- [ ] Set up monitoring and alerting

### Deployment
- [ ] Deploy server instances
- [ ] Verify WebSocket connectivity
- [ ] Test transaction monitoring
- [ ] Validate message routing

### Post-deployment
- [ ] Monitor connection statistics
- [ ] Check transaction processing
- [ ] Verify cross-server communication
- [ ] Monitor resource usage

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server status
   - Verify network connectivity
   - Check Redis configuration

2. **Solana RPC Issues**
   - Verify RPC endpoint accessibility
   - Check rate limits
   - Consider using dedicated RPC provider

3. **WebSocket Connection Limits**
   - Monitor server resources
   - Adjust connection limits
   - Consider load balancing

4. **Message Routing Issues**
   - Check Redis pub/sub functionality
   - Verify server discovery
   - Monitor message broker logs

## Future Enhancements

### 1. Advanced Features
- Message persistence and replay
- Advanced filtering and routing
- Message encryption
- Compression support

### 2. Performance Improvements
- Connection pooling
- Message batching
- Caching layer
- CDN integration

### 3. Monitoring Enhancements
- Real-time dashboards
- Advanced metrics
- Alerting and notifications
- Performance profiling

This architecture provides a robust, scalable foundation for real-time communication in the Community Coin platform, with support for blockchain transaction monitoring and multi-server deployment. 