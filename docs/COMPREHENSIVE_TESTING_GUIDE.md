# 🧪 Comprehensive Testing Guide

This guide covers all testing strategies for the Community Coin Rust server, from unit tests to full system integration tests.

## 📁 Test Organization

Tests are now organized in a dedicated `tests/` directory:

```
tests/
├── integration/           # Python integration tests
│   ├── test_new_transaction_types.py
│   └── test_websocket_communication.py
├── browser/              # Browser-based interactive tests
│   └── test_browser_websocket.html
├── e2e/                 # End-to-end tests (future)
└── README.md            # Test-specific documentation
```

### Integration Tests (`tests/integration/`)

Python-based tests that verify server functionality through real connections:

- **`test_new_transaction_types.py`**: Verifies transaction type handling (create, buy, sell, unknown)
- **`test_websocket_communication.py`**: Comprehensive WebSocket communication testing

### Browser Tests (`tests/browser/`)

Interactive HTML-based tests for manual WebSocket testing:

- **`test_browser_websocket.html`**: Real-time WebSocket testing interface with configurable endpoints

### Rust Unit/Integration Tests (`server_rust/tests/`)

Rust-native tests using the `tokio-test` framework:

- **`integration_tests.rs`**: Server API and WebSocket integration tests

## 🚀 Quick Start

### Run All Tests
```bash
# Complete test suite (recommended)
./scripts/run-tests.sh

# With load testing
./scripts/run-tests.sh --with-load
```

### Run Specific Test Types
```bash
# Unit tests only (fastest)
./scripts/run-tests.sh --unit-only

# Integration tests only
./scripts/run-tests.sh --integration-only

# API tests only
./scripts/run-tests.sh --api-only

# Skip infrastructure setup (if already running)
./scripts/run-tests.sh --skip-setup
```

### Manual Testing
```bash
# Unit tests
cd server_rust
cargo test --lib

# Integration tests
cargo test --test integration_tests

# Specific test
cargo test test_authentication_flow

# With output
cargo test -- --nocapture
```

## 🏗️ Test Infrastructure

### Automatic Setup
The test runner automatically sets up:
- ✅ PostgreSQL database (port 5433)
- ✅ Redis cache (port 6379)
- ✅ Solana localnet validator (port 8899)
- ✅ Smart contract deployment
- ✅ Rust server (port 8080)

### Manual Setup
If you need to set up manually:

```bash
# 1. Start database and Redis
cd server_rust
docker-compose -f docker-compose.deps.yml up -d

# 2. Start Solana validator
cd ../contracts
docker-compose up -d solana-validator

# 3. Deploy contracts
docker-compose exec solana-dev ./scripts/setup.sh

# 4. Start server
cd ../server_rust
cargo run
```

## 📝 Writing Tests

### Unit Test Example
```rust
// In src/api/handlers/auth.rs
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_login_success() {
        let state = create_test_app_state();
        
        let request = LoginRequest {
            wallet_address: "test_wallet".to_string(),
            signature: "test_signature".to_string(),
            message: "Login to Community Coin".to_string(),
        };
        
        let result = login(State(state), Json(request)).await;
        assert!(result.is_ok());
        
        let response = result.unwrap().0;
        assert!(!response.token.is_empty());
        assert!(response.expires_at > Utc::now());
    }
}
```

### Integration Test Example
```rust
// In tests/integration_tests.rs
#[tokio::test]
#[serial_test::serial]
async fn test_token_creation_flow() {
    let client = Client::new();
    
    // Create token
    let create_request = json!({
        "name": "Test Token",
        "symbol": "TEST",
        "description": "A test token",
        "initial_supply": 1000000
    });
    
    let response = client
        .post(&format!("{}/api/tokens", BASE_URL))
        .json(&create_request)
        .send()
        .await
        .expect("Failed to create token");
    
    assert_eq!(response.status(), 201);
    
    let created_token: Value = response.json().await
        .expect("Failed to parse created token");
    assert_eq!(created_token["name"], "Test Token");
}
```

## 🎯 Test Coverage

### Current Coverage
- ✅ **Authentication**: Login, logout, token refresh, JWT validation
- ✅ **Token Management**: Create, read, update, list tokens
- ✅ **User Management**: Create, read, update users
- ✅ **Trading**: Buy/sell orders, market data
- ✅ **WebSocket**: Connection, subscription, message handling
- ✅ **Analytics**: Platform stats, user stats
- ✅ **Social Features**: Discussions, notifications
- ✅ **Error Handling**: 404, 400, validation errors
- ✅ **Load Testing**: Concurrent requests

### Test Metrics
```bash
# Generate coverage report
cargo tarpaulin --out html
open tarpaulin-report.html
```

## 🔧 Test Configuration

### Environment Variables
Tests use these environment variables:
```bash
# Test database
DATABASE_URL=postgresql://postgres:password@localhost:5433/community_coin_db

# Test Redis
REDIS_URL=redis://localhost:6379

# Test Solana
SOLANA_RPC_URL=http://localhost:8899
SOLANA_WS_URL=ws://localhost:8900

# Test JWT
JWT_SECRET=test_secret_key_for_testing_at_least_32_characters_long
JWT_EXPIRY_HOURS=24

# Test environment
ENVIRONMENT=test
LOG_LEVEL=info
```

### Test Data
Tests use:
- Mock user data (UUID-based)
- Test wallet addresses
- Predefined token configurations
- Sample transaction data

## 🐛 Debugging Tests

### Failed Test Debugging
```bash
# Run with verbose output
cargo test -- --nocapture

# Run specific failing test
cargo test test_name -- --nocapture

# Check server logs
tail -f server_rust/server_test.log

# Check database
docker exec -it community_coin_postgres psql -U postgres -d community_coin_db
```

### Common Issues

#### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs community_coin_postgres

# Restart database
docker-compose -f server_rust/docker-compose.deps.yml restart postgres
```

#### Server Won't Start
```bash
# Check port conflicts
netstat -tlnp | grep 8080

# Check server logs
cat server_rust/server_test.log

# Check dependencies
docker ps
```

#### Solana Validator Issues
```bash
# Check validator status
curl http://localhost:8899 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# Restart validator
cd contracts
docker-compose restart solana-validator
```

## 📊 Performance Testing

### Load Testing
```bash
# Built-in load test
./scripts/run-tests.sh --with-load

# Custom load test
for i in {1..1000}; do
    curl -s http://localhost:8080/health &
done
wait
```

### Advanced Load Testing
```bash
# Install Artillery
npm install -g artillery

# Create load test config
cat > artillery-config.yml << EOF
config:
  target: 'http://localhost:8080'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Health check"
    requests:
      - get:
          url: "/health"
  - name: "API endpoints"
    requests:
      - get:
          url: "/api/tokens"
      - get:
          url: "/api/users"
EOF

# Run load test
artillery run artillery-config.yml
```

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: community_coin_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Install Rust
      uses: actions-rs/toolchain@v1
      with:
        toolchain: stable
        
    - name: Install dependencies
      run: |
        cargo install sqlx-cli --no-default-features --features postgres
        
    - name: Run migrations
      run: |
        cd server_rust
        sqlx migrate run
      env:
        DATABASE_URL: postgresql://postgres:password@localhost:5432/community_coin_db
        
    - name: Run tests
      run: |
        cd server_rust
        cargo test --all
      env:
        DATABASE_URL: postgresql://postgres:password@localhost:5432/community_coin_db
        REDIS_URL: redis://localhost:6379
```

## 📈 Test Monitoring

### Test Metrics Dashboard
```bash
# Start monitoring stack
cd server_rust
docker-compose -f docker-compose.prod.yml up -d

# Access Grafana
open http://localhost:3000
# Login: admin / admin123

# View test metrics:
# - Test execution time
# - Pass/fail rates
# - Coverage trends
# - Performance benchmarks
```

### Test Alerting
```yaml
# prometheus/test-alerts.yml
groups:
  - name: test_alerts
    rules:
      - alert: TestFailureRate
        expr: test_failures / test_total > 0.1
        for: 5m
        annotations:
          summary: "High test failure rate detected"
          
      - alert: TestExecutionTime
        expr: test_duration_seconds > 300
        for: 2m
        annotations:
          summary: "Tests taking too long to execute"
```

## 🎯 Best Practices

### Test Organization
1. **Unit tests** in the same file as the code they test
2. **Integration tests** in the `tests/` directory
3. **System tests** as shell scripts in `scripts/`
4. **Test data** in dedicated fixtures/mocks

### Test Naming
```rust
// Good test names
#[test]
fn test_login_with_valid_credentials_returns_jwt_token() { }

#[test]
fn test_create_token_with_invalid_data_returns_400_error() { }

#[test]
fn test_websocket_connection_handles_concurrent_messages() { }
```

### Test Structure
```rust
#[test]
fn test_function_name() {
    // Arrange - Set up test data
    let input = create_test_input();
    let expected = expected_output();
    
    // Act - Execute the function
    let result = function_under_test(input);
    
    // Assert - Verify the result
    assert_eq!(result, expected);
}
```

### Mock Usage
```rust
// Use mocks for external dependencies
#[cfg(test)]
impl SolanaClient {
    pub fn new_mock() -> Self {
        Self {
            rpc_url: "mock://localhost".to_string(),
            // ... other mock fields
        }
    }
}
```

## 🚀 Production Testing

### Staging Environment Tests
```bash
# Test against staging
export BASE_URL=https://staging-api.communitycoin.com
cargo test --test integration_tests

# Load test staging
artillery run --target https://staging-api.communitycoin.com artillery-config.yml
```

### Production Smoke Tests
```bash
# Health checks
curl https://api.communitycoin.com/health

# Basic functionality
curl https://api.communitycoin.com/api/tokens

# Monitor response times
curl -w "@curl-format.txt" -s -o /dev/null https://api.communitycoin.com/health
```

## 📚 Additional Resources

### Documentation
- [Rust Testing Guide](https://doc.rust-lang.org/book/ch11-00-testing.html)
- [Tokio Testing](https://tokio.rs/tokio/topics/testing)
- [Axum Testing](https://docs.rs/axum/latest/axum/testing/index.html)

### Tools
- **Coverage**: `cargo tarpaulin`
- **Benchmarking**: `cargo bench`
- **Load Testing**: `artillery`, `wrk`, `ab`
- **Mocking**: `mockall`, `wiremock`

### Example Projects
- [Axum Examples](https://github.com/tokio-rs/axum/tree/main/examples)
- [Real-world Rust Testing](https://github.com/LukeMathWalker/zero-to-production)

---

## 🎉 Summary

This testing strategy provides:
- ✅ **Comprehensive coverage** across all system layers
- ✅ **Fast feedback** with unit tests
- ✅ **Integration confidence** with API tests
- ✅ **System validation** with E2E tests
- ✅ **Performance assurance** with load tests
- ✅ **Production readiness** with staging tests

Run `./scripts/run-tests.sh` to get started! 🚀 