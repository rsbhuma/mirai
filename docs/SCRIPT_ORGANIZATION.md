# Script Organization Guide

## Overview
All utility scripts have been organized into the `scripts/` directory for better project structure and maintainability.

## Script Categories

### 🚀 Main Setup Scripts
- **`scripts/setup-localnet-e2e.sh`** - Main end-to-end setup script
  - Sets up complete development environment
  - Starts Solana validator, contracts, server, and client
  - Includes cleanup mechanisms and monitoring

### 🧪 Testing & Verification Scripts
- **`scripts/test-architecture.sh`** - Comprehensive architecture testing
  - Full test suite with pass/fail reporting
  - 12 different tests covering all components
  - Detailed output with test counters
  - Use for: Automated testing, CI/CD pipelines

- **`scripts/verify-architecture.sh`** - Simple architecture verification
  - Basic connectivity checks
  - Quick manual verification
  - Minimal output for quick checks
  - Use for: Manual testing, debugging

### 🛑 Cleanup Scripts
- **`scripts/cleanup-e2e.sh`** - Comprehensive cleanup
  - Stops all Docker containers and services
  - Cleans up networks and orphaned resources
  - Kills background processes
  - Use for: Complete environment reset

- **`scripts/quick-cleanup.sh`** - Quick container cleanup
  - Fast Docker container cleanup only
  - Minimal operations for speed
  - Use for: Quick cleanup between tests

- **`scripts/stop-localnet-e2e.sh`** - Graceful service shutdown
  - Stops services using PID files
  - Proper Docker Compose shutdown
  - Preserves data and configurations
  - Use for: Normal shutdown after testing

### 🔧 Utility Scripts
- **`scripts/test-db-connection.sh`** - Database connectivity testing
  - Tests PostgreSQL connection
  - Verifies server health
  - Use for: Database troubleshooting

## Key Differences

### `test-architecture.sh` vs `verify-architecture.sh`
| Feature | test-architecture.sh | verify-architecture.sh |
|---------|---------------------|------------------------|
| Purpose | Comprehensive testing | Quick verification |
| Output | Detailed test results | Simple status checks |
| Tests | 12 automated tests | 4 basic checks |
| Use Case | CI/CD, automated testing | Manual debugging |
| Pass/Fail | Yes, with counters | No, just status |

### `cleanup-e2e.sh` vs `stop-localnet-e2e.sh`
| Feature | cleanup-e2e.sh | stop-localnet-e2e.sh |
|---------|----------------|---------------------|
| Scope | Complete cleanup | Graceful shutdown |
| Docker | Removes containers | Stops containers |
| Data | May remove volumes | Preserves data |
| Speed | Thorough | Fast |
| Use Case | Environment reset | Normal shutdown |

## Usage Examples

```bash
# Start development environment
scripts/setup-localnet-e2e.sh

# Quick verification
scripts/verify-architecture.sh

# Full testing suite
scripts/test-architecture.sh

# Normal shutdown
scripts/stop-localnet-e2e.sh

# Complete cleanup
scripts/cleanup-e2e.sh

# Quick cleanup
scripts/quick-cleanup.sh
```

## Script Dependencies

```
setup-localnet-e2e.sh
├── Uses: cleanup-e2e.sh (for Ctrl+C cleanup)
├── References: verify-architecture.sh (in output)
└── Creates: stop-localnet-e2e.sh reference

test-architecture.sh
└── Independent (can run standalone)

verify-architecture.sh
└── Independent (can run standalone)

cleanup-e2e.sh
└── Independent (can run standalone)
```

## Best Practices

1. **Always run from project root**: All scripts expect to be run from `/home/rajasekhar/agora/community_coin_server/`
2. **Use appropriate cleanup**: Choose the right cleanup script for your needs
3. **Check script permissions**: Ensure scripts are executable (`chmod +x`)
4. **Read script output**: Scripts provide detailed status information
5. **Use Ctrl+C for setup**: The setup script has built-in cleanup on interrupt

## Troubleshooting

- If scripts fail with "permission denied": `chmod +x scripts/*.sh`
- If paths are wrong: Ensure you're in the project root directory
- If Docker issues: Run `scripts/cleanup-e2e.sh` first
- If database issues: Run `scripts/test-db-connection.sh` 