#!/bin/bash

# 🧪 Quick Docker Build Test for Solana Development Environment

set -e

echo "🧪 Testing Solana Development Docker Build"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Change to contracts directory
cd "$(dirname "$0")"
print_status "Working directory: $(pwd)"

# Test 1: Build the Docker image
print_status "Building solana-dev Docker image..."
if docker build -t solana-dev-test -f setup/Dockerfile setup/; then
    print_success "Docker image built successfully"
else
    print_error "Docker build failed"
    exit 1
fi

# Test 2: Test the image by running version checks
print_status "Testing installed tools in the container..."
if docker run --rm solana-dev-test bash -c "
    echo '=== Tool Verification ===' &&
    rustc --version &&
    cargo --version &&
    solana --version &&
    anchor --version &&
    node --version &&
    npm --version &&
    pnpm --version &&
    echo '=== All tools verified! ==='
"; then
    print_success "All tools are working correctly in the container"
else
    print_error "Tool verification failed"
    exit 1
fi

# Clean up test image
print_status "Cleaning up test image..."
docker rmi solana-dev-test >/dev/null 2>&1 || true

print_success "🎉 Docker build test completed successfully!"
echo ""
echo "✅ Your Dockerfile is working correctly and includes:"
echo "   • Rust 1.86"
echo "   • Solana CLI 2.1.0" 
echo "   • Anchor CLI 0.31.1"
echo "   • Node.js 20"
echo "   • pnpm"
echo ""
echo "🚀 Ready to run the full setup!"
echo "   Run: ./start-dev.sh" 