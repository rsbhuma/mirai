#!/bin/bash

echo "🧪 Testing Solana Development Environment Setup..."

# Navigate to contracts directory
cd "$(dirname "$0")"

echo "📦 Building and starting services..."
docker-compose up -d --build

echo "⏳ Waiting for services to be ready (30 seconds)..."
sleep 30

echo "🔍 Checking service status..."
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Services are not running properly"
    echo "📋 Service status:"
    docker-compose ps
    echo "📋 Logs:"
    docker-compose logs
    exit 1
fi

echo "✅ Services are running!"

echo "🔧 Testing development environment..."
docker-compose exec -T solana-dev bash -c "
    echo '🔍 Checking tool versions...'
    echo 'Rust: '$(rustc --version)
    echo 'Solana: '$(solana --version)
    echo 'Anchor: '$(anchor --version)
    echo 'Node.js: '$(node --version)
    echo 'pnpm: '$(pnpm --version)
    echo ''
    
    echo '🔧 Setting up Solana environment...'
    cd commcoin
    ./scripts/setup.sh
    
    echo ''
    echo '📦 Installing dependencies...'
    pnpm install --silent
    
    echo ''
    echo '🏗️  Building smart contract...'
    if anchor build; then
        echo '✅ Build successful!'
    else
        echo '❌ Build failed!'
        exit 1
    fi
    
    echo ''
    echo '🧪 Running tests...'
    if anchor test --skip-local-validator; then
        echo '✅ Tests passed!'
    else
        echo '❌ Tests failed!'
        exit 1
    fi
"

TEST_RESULT=$?

echo ""
if [ $TEST_RESULT -eq 0 ]; then
    echo "🎉 All tests passed! The development environment is working correctly."
    echo ""
    echo "🚀 You can now start developing:"
    echo "   ./start-dev.sh                           # Start the environment"
    echo "   docker-compose exec solana-dev bash      # Enter development container"
else
    echo "❌ Tests failed. Please check the logs above."
fi

echo ""
echo "🛑 Stopping test environment..."
docker-compose down

exit $TEST_RESULT 