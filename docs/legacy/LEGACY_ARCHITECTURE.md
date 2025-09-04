# Community Coin Server Architecture Documentation

This document provides a detailed explanation of the Community Coin Server's architecture, components, and their interactions.

## Table of Contents
1. [Project Structure](#project-structure)
2. [Core Components](#core-components)
3. [Data Flow](#data-flow)
4. [Current Implementation Status](#current-implementation-status)
5. [Error Handling](#error-handling)
6. [Configuration Management](#configuration-management)
7. [Dependencies](#dependencies)
8. [Performance Considerations](#performance-considerations)

## Project Structure

```
server_rust/
├── src/
│   ├── main.rs           # Application entry point and server setup
│   ├── api/             # API handlers and WebSocket
│   │   ├── mod.rs       # API module definition
│   │   ├── handlers.rs  # HTTP request handlers
│   │   └── ws.rs       # WebSocket server implementation
│   ├── blockchain/      # Blockchain interactions
│   │   ├── mod.rs       # Blockchain module definition
│   │   └── solana.rs    # Solana client and Helius API integration
│   ├── config/          # Configuration management
│   │   └── mod.rs       # Environment configuration
│   ├── services/        # Business logic
│   │   ├── mod.rs       # Services module definition
│   │   └── token.rs     # Token operations
│   ├── models/         # Data models and structures
│   │   ├── mod.rs      # Model module definition
│   │   └── transaction.rs # Transaction model definitions
│   └── utils/          # Utility functions
│       └── mod.rs      # Common utilities
├── Cargo.toml          # Dependencies and metadata
├── .env               # Environment configuration
└── test files/        # Testing utilities
```

## Core Components

### 1. Main Application (main.rs)
- **Purpose**: Application entry point and HTTP server setup
- **Key Responsibilities**:
  - Initialize server configuration
  - Set up Axum web framework
  - Configure logging with tracing
  - Define API routes
  - Start HTTP server with WebSocket support
  - Initialize blockchain listener
- **API Endpoints**:
  - `GET /`: Health check
  - `GET /api/health`: Health check
  - `GET /api/transaction/:id`: Get transaction details
  - `POST /api/transaction`: Create transaction
  - `GET /create/wallet/:wallet_name`: Create new wallet
  - `GET /send/tokens/:to_address/mint/:mint_address`: Send tokens

### 2. API Layer (api/)
- **Purpose**: Handle HTTP requests and WebSocket connections
- **Key Components**:
  - `handlers.rs`: Implement request handling logic
  - `ws.rs`: WebSocket server implementation with real-time broadcasting
  - `mod.rs`: Module organization and exports
- **Responsibilities**:
  - Request validation and processing
  - Response formatting
  - Error handling
  - WebSocket connection management
  - Real-time transaction broadcasting
  - Connection state tracking

### 3. Blockchain Layer (blockchain/)
- **Purpose**: Manage blockchain interactions and transaction monitoring
- **Key Components**:
  - `solana.rs`: Solana client and Helius API integration
  - `mod.rs`: Module organization
- **Features**:
  - Helius API integration for enhanced transaction data
  - Real transaction parsing and categorization
  - Mock transaction generation for continuous activity
  - Transaction deduplication
  - Slot monitoring and new transaction detection
  - Connection management and error handling

### 4. Models (models/)
- **Purpose**: Define data structures and types
- **Key Components**:
  - `mod.rs`: Module organization and exports
  - `transaction.rs`: Transaction-related model definitions
- **Model Types**:
  - `TransactionEvent`: Main transaction event structure
  - `TransactionType`: Enum for transaction categorization
  - `HeliusTransaction`: Helius API response structure
  - Request/Response structures
  - WebSocket message types

### 5. Configuration (config/mod.rs)
- **Purpose**: Manage application configuration
- **Key Components**:
  - `ServerConfig` struct
  - Environment variable loading
  - Configuration validation
- **Configuration Parameters**:
  - Helius API key and endpoints
  - Solana RPC URL
  - Server port and host
  - Logging level

### 6. Token Services (services/token.rs)
- **Purpose**: Handle token-related business logic
- **Key Functions**:
  - `create_wallet()`: Create new Solana wallet
  - `send_tokens()`: Transfer tokens
  - `get_token_balance()`: Check token balance
- **Integration Points**:
  - Solana blockchain
  - Error handling

### 7. WebSocket Server (api/ws.rs)
- **Purpose**: Handle real-time WebSocket connections and broadcasting
- **Key Components**:
  - WebSocket server setup with Axum
  - Connection management and state tracking
  - Message handling and routing
  - Event broadcasting to connected clients
- **Features**:
  - Real-time transaction updates
  - Connection state management
  - Message routing and command processing
  - Auto-reconnection support
  - Broadcast channel integration
- **WebSocket Events**:
  - Transaction updates with categorization
  - Connection status updates
  - Error notifications
  - System status updates

## Current Implementation Status

### ✅ Working Features
1. **Real Transaction Processing**
   - Successfully fetches real transactions from Helius API
   - Parses and categorizes transaction types accurately
   - Handles 98 historical transactions on startup
   - Prevents duplicate transaction broadcasting

2. **Transaction Categorization**
   - **Buy**: Token purchase events
   - **Sell**: Token sale events
   - **Create**: Token creation events
   - **Burn**: Token burn events
   - **Swap**: Token swap events
   - **Transfer**: Token transfer events
   - **Unknown**: Other transactions

3. **Real-time Simulation**
   - Generates 2-4 mock transactions every 2 seconds
   - Maintains continuous activity for testing
   - Uses realistic transaction data and amounts
   - Proper transaction type distribution

4. **WebSocket Broadcasting**
   - Real-time broadcasting of transaction events
   - Connection management and state tracking
   - Auto-reconnection handling
   - Command processing (subscribe, create, buy, sell)

### 🔄 Current Limitations
1. **Historical Data Source**
   - Using Helius API endpoint that returns historical transactions
   - Not true real-time streaming
   - Limited to 98 transactions per API call

2. **Simulated Real-time**
   - Mock transactions for continuous activity
   - Not actual live blockchain events
   - True real-time requires WebSocket subscription to Helius

3. **Transaction Processing**
   - Processes same historical transactions repeatedly
   - No persistent storage for transaction history
   - Limited filtering and search capabilities

## Data Flow

### 1. Transaction Processing Flow
```
Helius API → Transaction Fetching → Parsing → Categorization → WebSocket Broadcasting → Client
```

### 2. WebSocket Communication Flow
```
Client Connection → WebSocket Handler → Command Processing → Event Broadcasting → Client Update
```

### 3. Mock Transaction Generation Flow
```
Timer Trigger → Mock Generation → Transaction Creation → WebSocket Broadcasting → Client
```

### 4. Real Transaction Processing Flow
```
Slot Monitoring → New Slot Detection → Helius API Call → Transaction Parsing → Deduplication → Broadcasting
```

## Error Handling

### Error Types
1. **API Errors**
   - Helius API connection failures
   - Response parsing errors
   - Network timeouts

2. **WebSocket Errors**
   - Connection failures
   - Message parsing errors
   - Broadcast channel errors

3. **Transaction Errors**
   - Invalid transaction data
   - Categorization failures
   - Duplicate detection errors

### Error Recovery
- Automatic retry mechanisms for API calls
- Graceful degradation to mock transactions
- Connection state management
- Comprehensive error logging

## Configuration Management

### Environment Variables
```bash
HELIUS_API_KEY=c9108d6b-a742-44c0-862a-2da912d111e5
HELIUS_RPC_URL=https://api.helius.xyz/v0/addresses/DGCQGZ2uTpbCo5wnehuF9QyoRMXUdAtZTrF2ENbzHN3P/transactions?api-key=c9108d6b-a742-44c0-862a-2da912d111e5
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
RUST_LOG=info
SERVER_PORT=9000
SERVER_HOST=127.0.0.1
```

### Configuration Validation
- Required environment variables checking
- API endpoint validation
- Server configuration validation
- Logging level configuration

## Dependencies

### Core Dependencies
- **tokio**: Async runtime
- **axum**: Web framework
- **serde**: Serialization/deserialization
- **reqwest**: HTTP client for API calls
- **tracing**: Logging and tracing
- **tower**: HTTP middleware

### Blockchain Dependencies
- **solana-client**: Solana blockchain client
- **solana-transaction-status**: Transaction status handling

### WebSocket Dependencies
- **tokio-tungstenite**: WebSocket implementation
- **futures**: Async programming utilities

## Performance Considerations

### Current Performance
- **Transaction Processing**: ~98 transactions per API call
- **Mock Generation**: 2-4 transactions every 2 seconds
- **WebSocket Broadcasting**: Real-time with minimal latency
- **Memory Usage**: Efficient with connection pooling
- **CPU Usage**: Low with async processing

### Optimization Opportunities
1. **True Real-time Integration**
   - WebSocket subscription to Helius
   - Live transaction streaming
   - Reduced API call frequency

2. **Caching and Storage**
   - Redis caching for transaction data
   - Database storage for transaction history
   - In-memory transaction deduplication

3. **Scalability Improvements**
   - Connection pooling
   - Load balancing
   - Horizontal scaling support

### Monitoring and Metrics
- Transaction processing rates
- WebSocket connection counts
- API response times
- Error rates and types
- Memory and CPU usage

## Next Steps

### Immediate Improvements
1. **True Real-time Integration**
   - Implement WebSocket subscription to Helius
   - Live transaction streaming
   - Real-time slot monitoring

2. **Enhanced Transaction Processing**
   - Persistent storage implementation
   - Advanced filtering and search
   - Transaction analytics

3. **Frontend Integration**
   - Enhanced UI with transaction history
   - Real-time charts and graphs
   - User authentication

### Long-term Goals
1. **Scalability**
   - Microservices architecture
   - Load balancing
   - Horizontal scaling

2. **Advanced Features**
   - Transaction analytics
   - Market data integration
   - Notification system

3. **Security**
   - Authentication and authorization
   - Rate limiting
   - Input validation 