#!/bin/bash

echo "🚀 Setting up Solana development environment..."

# Create .config directory if it doesn't exist
mkdir -p ~/.config/solana

# Set Solana cluster to the validator service (Docker internal network)
echo "📡 Configuring Solana cluster..."
solana config set --url http://solana-validator:8899

# Generate a new keypair if it doesn't exist
if [ ! -f ~/.config/solana/id.json ]; then
    echo "🔑 Generating new keypair..."
    solana-keygen new --no-passphrase --outfile ~/.config/solana/id.json
else
    echo "🔑 Using existing keypair..."
fi

# Set the keypair
solana config set --keypair ~/.config/solana/id.json

# Wait for validator to be ready
echo "⏳ Waiting for Solana validator to be ready..."
for i in {1..30}; do
    if solana cluster-version >/dev/null 2>&1; then
        echo "✅ Solana validator is ready!"
        break
    fi
    echo "   Attempt $i/30 - waiting 2 seconds..."
    sleep 2
done

# Check if validator is ready
if ! solana cluster-version >/dev/null 2>&1; then
    echo "❌ Failed to connect to Solana validator"
    echo "   Make sure the validator is running: docker-compose up solana-validator"
    echo "   Validator should be accessible at: http://solana-validator:8899"
    exit 1
fi

# Airdrop SOL to the wallet
echo "💰 Airdropping SOL to wallet..."
PUBKEY=$(solana-keygen pubkey ~/.config/solana/id.json)
echo "   Wallet address: $PUBKEY"

# Try to airdrop with retries
for i in {1..3}; do
    if solana airdrop 10 >/dev/null 2>&1; then
        echo "✅ Airdropped 10 SOL successfully!"
        break
    fi
    echo "   Airdrop attempt $i/3 failed, retrying..."
    sleep 2
done

# Check balance
BALANCE_RAW=$(solana balance --lamports 2>/dev/null || echo "0")
BALANCE=$(echo "$BALANCE_RAW" | grep -o '[0-9]*' | head -1)
if [ "$BALANCE" -gt 0 ] 2>/dev/null; then
    SOL_BALANCE=$(echo "scale=2; $BALANCE / 1000000000" | bc -l 2>/dev/null || echo "Unknown")
    echo "💳 Current balance: $SOL_BALANCE SOL"
else
    echo "⚠️  Warning: Unable to get balance or balance is 0"
fi

# Display configuration
echo ""
echo "📋 Solana Configuration:"
solana config get

echo ""
echo "✅ Setup complete! You can now:"
echo "   • Build the contract: anchor build"
echo "   • Deploy with Solana CLI: solana program deploy target/deploy/commcoin.so"
echo "   • Run tests: anchor test --skip-local-validator"
echo ""
echo "💡 Note: Use 'solana program deploy' instead of 'anchor deploy' in Docker environment"