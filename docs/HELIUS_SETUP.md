# Helius API Setup Guide

This guide explains how to set up Helius API to get real Solana blockchain data instead of mock data.

## What is Helius?

Helius is a Solana RPC provider that offers enhanced APIs for blockchain data. It provides:
- High-performance RPC endpoints
- Enhanced transaction parsing
- WebSocket subscriptions
- Better rate limits than public RPCs

## Setup Steps

### 1. Get a Helius API Key

1. Go to [https://www.helius.dev/](https://www.helius.dev/)
2. Sign up for a free account
3. Create a new API key
4. Copy your API key

### 2. Run the Setup Script

```bash
cd server_rust
python3 setup_helius.py
```

The script will:
- Ask for your Helius API key
- Test the connection
- Update the `.env` file automatically
- Verify the API works with sample data

### 3. Manual Setup (Alternative)

If you prefer to set up manually:

1. Edit the `.env` file:
```bash
cd server_rust
nano .env
```

2. Replace `YOUR_API_KEY` with your actual Helius API key:
```
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/v0/YOUR_ACTUAL_API_KEY
```

### 4. Test the Connection

Run the setup script to test your connection:
```bash
python3 setup_helius.py
```

## Current Implementation Status

### ✅ What's Working
- Environment variable configuration
- Fallback to public RPC if Helius fails
- Mock data generation as backup
- WebSocket broadcasting of transaction events

### 🔄 What's in Progress
- Real transaction fetching from Solana blockchain
- Transaction type classification (create, buy, sell, unknown)
- Transaction amount and address extraction

### 📋 Next Steps
1. **Get your Helius API key** using the setup script
2. **Test the connection** to ensure it works
3. **Run the server** to see real blockchain data
4. **Monitor the logs** to see transaction processing

## Running the Server

After setting up your Helius API key:

```bash
cd server_rust
cargo run
```

The server will:
1. Try to connect to Helius RPC
2. If successful, fetch real blockchain data
3. If failed, fall back to public RPC
4. If both fail, use mock data

## Monitoring

Check the server logs to see:
- Which RPC URL is being used
- Real transaction processing
- WebSocket broadcasting status

Example log output:
```
INFO community_coin_server: Using RPC URL: https://mainnet.helius-rpc.com/v0/YOUR_API_KEY
INFO community_coin_server::blockchain::solana: Starting Solana blockchain listener...
INFO community_coin_server::blockchain::solana: Starting from slot: 347626290
INFO community_coin_server::blockchain::solana: Broadcasted create transaction event
```

## Troubleshooting

### Connection Issues
- Verify your API key is correct
- Check your internet connection
- Ensure you're not hitting rate limits

### No Real Data
- The server falls back to mock data if real data fails
- Check logs for connection errors
- Verify your Helius account is active

### Rate Limits
- Free Helius accounts have rate limits
- Consider upgrading for production use
- The server handles rate limit errors gracefully

## API Limits

### Free Tier
- 100 requests per second
- 1,000,000 requests per month
- Basic RPC endpoints

### Paid Tiers
- Higher rate limits
- Enhanced APIs
- Priority support

## Next Development Steps

Once the basic Helius integration is working, we can enhance:

1. **Real Transaction Processing**
   - Fetch actual transactions from blocks
   - Parse transaction instructions
   - Extract real amounts and addresses

2. **Enhanced Classification**
   - Token creation detection
   - Buy/sell transaction analysis
   - Token transfer tracking

3. **Performance Optimization**
   - Batch transaction processing
   - Caching frequently accessed data
   - Optimized WebSocket broadcasting

## Support

If you encounter issues:
1. Check the server logs for error messages
2. Verify your Helius API key is valid
3. Test the connection using the setup script
4. Consider using the fallback public RPC temporarily 