# Community Coin Project

A real-time Solana blockchain monitoring and trading platform with WebSocket-based transaction broadcasting and React frontend.

## 🏗️ Project Architecture

```
community_coin_server/
├── server_rust/           # Rust WebSocket server (Port 9000)
├── research/replit_client/ # React frontend + Express backend (Ports 5174, 5000)
├── contracts/             # Solana smart contracts
├── client/                # Legacy client code
├── server/                # Legacy server code
└── test files/            # WebSocket testing utilities
```

## 🚀 Quick Start

### Prerequisites
- Rust 1.70+
- Node.js 18+
- Python 3.7+
- PostgreSQL (for Express backend)

### 1. Start Rust WebSocket Server
```bash
cd server_rust
cargo run
```
**Status**: ✅ Running on port 9000

### 2. Start Express Backend
```bash
cd research/replit_client
export DATABASE_URL="postgresql://postgres:db999@localhost:5432/tokenforge"
npm run dev
```
**Status**: ✅ Running on port 5000

### 3. Start React Frontend
```bash
cd research/replit_client
npx vite --port 5173 --host
```
**Status**: ✅ Running on port 5174

## 🔧 Current Features

### ✅ Implemented
- **Real-time Transaction Monitoring**: Rust server monitors Solana blockchain
- **WebSocket Broadcasting**: Live transaction events to connected clients
- **Transaction Categorization**: Buy, sell, create, burn, swap, transfer events
- **React Frontend**: Real-time transaction display with auto-reconnection
- **Helius API Integration**: Enhanced blockchain data parsing
- **Mock Transaction Generation**: Continuous real-time simulation
- **Express Backend**: REST API for market data and tokens

### 🔄 Current Status
- **Data Source**: Historical transactions from Helius API + mock simulation
- **Real-time Simulation**: 2-4 mock transactions every 2 seconds
- **Transaction Types**: 6 types supported with proper categorization
- **Frontend**: Live updates with connection status and auto-reconnect

### 📊 Transaction Processing
- **Initial Load**: 98 historical transactions on startup
- **Real-time**: Mock transactions generated continuously
- **Deduplication**: Prevents broadcasting duplicate transactions
- **Categorization**: Accurate transaction type identification

## 🌐 API Endpoints

### WebSocket Server (Rust)
- **URL**: `ws://localhost:9000/api/ws`
- **Commands**: `subscribe`, `create`, `buy`, `sell`
- **Events**: Real-time transaction broadcasts

### REST API (Express)
- **Base URL**: `http://localhost:5000`
- **Endpoints**: `/api/tokens`, `/api/market/stats`

### Helius API
- **Endpoint**: `https://api.helius.xyz/v0/addresses/DGCQGZ2uTpbCo5wnehuF9QyoRMXUdAtZTrF2ENbzHN3P/transactions?api-key=c9108d6b-a742-44c0-862a-2da912d111e5`

## 🧪 Testing

### WebSocket Testing
```bash
# HTML test page
python3 -m http.server 8080
# Open test_browser_websocket.html

# Python test script
python test_websocket_communication.py

# Transaction type testing
python test_new_transaction_types.py
```

### Manual Testing
```bash
# Test WebSocket connection
wscat -c ws://localhost:9000/api/ws
# Send: subscribe, create, buy, sell
```

## 📁 Project Structure

### Core Components
- **`server_rust/`**: Rust WebSocket server with blockchain monitoring
- **`research/replit_client/`**: React frontend + Express backend
- **`contracts/`**: Solana smart contracts (Anchor framework)
- **`test_*.py`**: Python testing utilities
- **`test_browser_websocket.html`**: Browser-based WebSocket testing

### Key Files
- **`tech_setup.MD`**: Technical setup and configuration
- **`server_rust/README.md`**: Detailed Rust server documentation
- **`server_rust/ARCHITECTURE.md`**: Architecture documentation
- **`.env`**: Environment variables (create in server_rust/)

## 🔑 Environment Variables

### Rust Server (server_rust/.env)
```bash
HELIUS_API_KEY=c9108d6b-a742-44c0-862a-2da912d111e5
HELIUS_RPC_URL=https://api.helius.xyz/v0/addresses/DGCQGZ2uTpbCo5wnehuF9QyoRMXUdAtZTrF2ENbzHN3P/transactions?api-key=c9108d6b-a742-44c0-862a-2da912d111e5
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
RUST_LOG=info
SERVER_PORT=9000
SERVER_HOST=127.0.0.1
```

### Express Server
```bash
DATABASE_URL=postgresql://postgres:db999@localhost:5432/tokenforge
NODE_ENV=development
```

## 🎯 Transaction Types

| Type | Description | Status |
|------|-------------|--------|
| **Buy** | Token purchase events | ✅ Implemented |
| **Sell** | Token sale events | ✅ Implemented |
| **Create** | Token creation events | ✅ Implemented |
| **Burn** | Token burn events | ✅ Implemented |
| **Swap** | Token swap events | ✅ Implemented |
| **Transfer** | Token transfer events | ✅ Implemented |
| **Unknown** | Other transactions | ✅ Implemented |

## 🚧 Current Limitations

1. **Historical Data**: Using Helius API endpoint that returns historical transactions
2. **Simulated Real-time**: Mock transactions for continuous activity simulation
3. **True Real-time Pending**: WebSocket subscription to Helius not yet implemented

## 🔮 Next Steps

### Immediate
- [ ] Implement true real-time WebSocket subscription to Helius
- [ ] Add transaction filtering and search
- [ ] Enhance frontend UI with transaction history
- [ ] Add user authentication

### Future
- [ ] Implement persistent transaction storage
- [ ] Add advanced analytics and charts
- [ ] Create mobile-responsive design
- [ ] Add notification system
- [ ] Implement rate limiting and security

## 📚 Documentation

- **`tech_setup.MD`**: Technical setup and running instructions
- **`server_rust/README.md`**: Rust server documentation
- **`server_rust/ARCHITECTURE.md`**: Detailed architecture guide
- **`contracts/README.MD`**: Smart contract documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues
1. **Port conflicts**: Check if ports 9000, 5000, 5173 are available
2. **Database connection**: Ensure PostgreSQL is running and accessible
3. **WebSocket connection**: Verify Rust server is running on port 9000
4. **Environment variables**: Check all required .env files are present

### Logs
- **Rust server**: Check console output for transaction processing logs
- **Express server**: Check console for API request logs
- **Frontend**: Check browser console for WebSocket connection status 