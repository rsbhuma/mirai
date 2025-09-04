# Transaction Listener Startup Guide

## Overview

The Transaction Listener is a core component of the Community Coin server that monitors Solana blockchain transactions in real-time and broadcasts relevant updates to WebSocket clients. This guide covers how to start, configure, monitor, and troubleshoot the transaction listener.

## 🚀 Quick Start

### Basic Startup

The transaction listener starts automatically when you run the server:

```bash
cd server_rust
cargo run
```

**Expected Output:**
```
📡 Initializing transaction listener...
✅ Transaction listener started
Starting Solana transaction listener...
Listening to program transactions: 6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX
Listening to token transactions
Listening to account transactions
```

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `TRANSACTION_LISTENER_ENABLED` | `true` | Enable/disable transaction listener | No |
| `SOLANA_RPC_URL` | `http://localhost:8899` | Solana RPC endpoint | Yes |
| `SOLANA_WS_URL` | `ws://localhost:8900` | Solana WebSocket endpoint | Yes |
| `COMMCOIN_PROGRAM_ID` | `6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX` | Program ID to monitor | Yes |
| `HELIUS_API_KEY` | None | Helius API key for enhanced RPC | No |

### RPC Endpoint Configuration

#### Local Development
```bash
export SOLANA_RPC_URL=http://localhost:8899
export SOLANA_WS_URL=ws://localhost:8900
```

#### Mainnet (Public RPC)
```bash
export SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
export SOLANA_WS_URL=wss://api.mainnet-beta.solana.com
```

#### Helius (Recommended for Production)
```bash
export HELIUS_API_KEY=your_helius_api_key
# RPC URL will be automatically set to: https://mainnet.helius-rpc.com/v0/${HELIUS_API_KEY}
# WS URL will be automatically set to: wss://mainnet.helius-rpc.com/v0/websocket
```

#### Other RPC Providers
```bash
# QuickNode
export SOLANA_RPC_URL=https://your-endpoint.solana-mainnet.quiknode.pro/your-api-key/
export SOLANA_WS_URL=wss://your-endpoint.solana-mainnet.quiknode.pro/your-api-key/

# Alchemy
export SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/your-api-key
export SOLANA_WS_URL=wss://solana-mainnet.g.alchemy.com/v2/your-api-key
```

### Enable/Disable Transaction Listener

```bash
# Enable (default)
export TRANSACTION_LISTENER_ENABLED=true

# Disable
export TRANSACTION_LISTENER_ENABLED=false
```

## 🔧 Manual Control

### Automatic Startup (Default)

The transaction listener is automatically started in a background task when the server initializes:

```rust
// From main.rs
if config.transaction_listener_enabled {
    info!("📡 Initializing transaction listener...");
    let transaction_listener = TransactionListener::new(
        config.clone(),
        solana.clone(),
        scalable_websocket_manager.clone(),
    );
    
    // Start transaction listener in background
    tokio::spawn(async move {
        if let Err(e) = transaction_listener.start_listening().await {
            error!("Transaction listener failed: {}", e);
        }
    });
    info!("✅ Transaction listener started");
}
```

### Manual Startup Function

You can also start the transaction listener manually:

```rust
use crate::websocket::start_transaction_listener;

// Start manually
tokio::spawn(async move {
    start_transaction_listener(config, solana, websocket_manager).await
});
```

### Transaction Listener Instance Methods

```rust
let listener = TransactionListener::new(config, solana_client, websocket_manager);

// Start listening
listener.start_listening().await?;

// Stop listening
listener.stop();

// Check if running
// (The listener runs in a background task, so you can check via logs)
```

## 📊 Monitoring

### Check if Transaction Listener is Running

#### 1. Server Logs
Look for these log messages:
```
📡 Initializing transaction listener...
✅ Transaction listener started
Starting Solana transaction listener...
Listening to program transactions: 6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX
Listening to token transactions
Listening to account transactions
```

#### 2. WebSocket Connection Test
Connect a WebSocket client to verify transaction updates:

```javascript
const ws = new WebSocket('ws://localhost:8080/ws');
ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('Transaction update:', message);
};
```

#### 3. API Endpoint Check
```bash
# Check connection statistics
curl http://localhost:8080/api/ws/connections

# Expected response:
{
    "total_connections": 1,
    "active_users": 1,
    "subscriptions": 0,
    "server_id": "server-abc123"
}
```

### Test Transaction Listener

#### Using the Test Page
```bash
# Open the test page in your browser
open server_rust/test_websocket.html
```

#### Using the Test Script
```bash
# Make the script executable
chmod +x server_rust/scripts/test_websocket.sh

# Run the test
./server_rust/scripts/test_websocket.sh
```

#### Manual WebSocket Test
```bash
# Install wscat if not available
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:8080/ws

# Send a ping message
{"type": "ping"}
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. RPC Connection Failed

**Symptoms:**
- `Transaction listener failed: Solana RPC request failed`
- `WebSocket connection failed`

**Solutions:**
```bash
# Test RPC endpoint connectivity
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
  https://api.mainnet-beta.solana.com

# Check if endpoint is accessible
ping api.mainnet-beta.solana.com

# Try alternative RPC endpoints
export SOLANA_RPC_URL=https://solana-api.projectserum.com
```

#### 2. WebSocket Connection Issues

**Symptoms:**
- `WebSocket connection failed`
- Connection timeouts

**Solutions:**
```bash
# Test WebSocket endpoint
wscat -c wss://api.mainnet-beta.solana.com

# Check firewall settings
# Ensure port 443/80 is open for outbound connections
```

#### 3. Rate Limiting

**Symptoms:**
- `429 Too Many Requests`
- Intermittent connection failures

**Solutions:**
```bash
# Use a dedicated RPC provider
export HELIUS_API_KEY=your_api_key

# Or implement connection pooling
# Add retry logic with exponential backoff
```

#### 4. Program ID Not Found

**Symptoms:**
- No transaction updates
- `Invalid program ID` errors

**Solutions:**
```bash
# Verify program ID exists
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getAccountInfo","params":["6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX"]}' \
  https://api.mainnet-beta.solana.com

# Update program ID if needed
export COMMCOIN_PROGRAM_ID=your_actual_program_id
```

### Debug Logging

Enable detailed logging to diagnose issues:

```bash
# Enable debug logging
export LOG_LEVEL=debug
export RUST_LOG=websocket=debug,transaction_listener=debug,blockchain=debug

# Run server with debug output
cargo run
```

**Debug Output Example:**
```
[DEBUG] Connecting to Solana WebSocket: wss://api.mainnet-beta.solana.com
[DEBUG] Subscribing to program logs: 6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX
[DEBUG] Received transaction notification: {...}
[DEBUG] Broadcasting transaction update to 5 clients
```

### Health Checks

#### RPC Health Check
```bash
# Test RPC health
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
  $SOLANA_RPC_URL
```

#### WebSocket Health Check
```bash
# Test WebSocket connectivity
wscat -c $SOLANA_WS_URL
```

## 🔄 Restart and Recovery

### Restart Transaction Listener

#### Method 1: Restart Server
```bash
# Stop server
Ctrl+C

# Restart
cargo run
```

#### Method 2: Implement Restart Function
Add this to your transaction listener:

```rust
impl TransactionListener {
    pub async fn restart(&self) -> AppResult<()> {
        self.stop();
        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
        self.start_listening().await
    }
}
```

### Automatic Recovery

The transaction listener includes automatic recovery features:

- **Automatic Reconnection**: Reconnects on connection loss
- **Exponential Backoff**: Retries with increasing delays
- **Error Handling**: Graceful handling of RPC errors
- **Health Monitoring**: Continuous health checks

## 📈 Production Deployment

### Recommended Configuration

```bash
# Production environment variables
export ENVIRONMENT=production
export TRANSACTION_LISTENER_ENABLED=true
export HELIUS_API_KEY=your_production_helius_key
export LOG_LEVEL=info
export WEBSOCKET_MAX_CONNECTIONS=10000
export WEBSOCKET_HEARTBEAT_INTERVAL=30
```

### High Availability Setup

#### Multiple RPC Endpoints
```bash
# Primary RPC
export SOLANA_RPC_URL=https://mainnet.helius-rpc.com/v0/primary_key

# Backup RPC (implement fallback logic)
export SOLANA_RPC_URL_BACKUP=https://mainnet.helius-rpc.com/v0/backup_key
```

#### Load Balancing
```bash
# Server 1 - Primary transaction listener
export SERVER_ID=server-1
export TRANSACTION_LISTENER_ENABLED=true

# Server 2 - Backup transaction listener
export SERVER_ID=server-2
export TRANSACTION_LISTENER_ENABLED=true
```

### Monitoring and Alerting

#### Key Metrics to Monitor
- Transaction processing rate
- RPC response times
- WebSocket connection count
- Error rates
- Memory usage

#### Alerting Setup
```bash
# Monitor transaction listener logs
tail -f server.log | grep "transaction_listener"

# Set up alerts for:
# - Connection failures
# - High error rates
# - Memory usage spikes
# - Transaction processing delays
```

## 🧪 Testing

### Unit Tests
```bash
# Run transaction listener tests
cargo test transaction_listener

# Run all WebSocket tests
cargo test websocket
```

### Integration Tests
```bash
# Test with local Solana validator
solana-test-validator &
export SOLANA_RPC_URL=http://localhost:8899
cargo run

# Test transaction broadcasting
# Send test transactions and verify WebSocket updates
```

### Load Testing
```bash
# Test with multiple WebSocket connections
# Use tools like Artillery or custom scripts
# Monitor server performance under load
```

## 📚 Additional Resources

### Documentation
- [WebSocket Architecture Guide](./WEBSOCKET_ARCHITECTURE.md)
- [Configuration Guide](./websocket_config.md)
- [Solana RPC Documentation](https://docs.solana.com/developing/clients/jsonrpc-api)

### Tools
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [wscat](https://github.com/websockets/wscat) - WebSocket testing tool
- [Helius Dashboard](https://dev.helius.xyz/) - RPC provider dashboard

### Support
- Check server logs for detailed error messages
- Verify RPC endpoint accessibility
- Test with different RPC providers
- Monitor network connectivity

This guide should help you successfully start and manage the transaction listener for your Community Coin server! 