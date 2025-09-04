# ⚓ Contracts Development Setup (Local)

This guide explains how to set up the Solana smart contracts (`contracts/commcoin`) for local development on your laptop.

## 📋 Prerequisites

### Required Software
- **Rust** (latest stable version)
- **Solana CLI** (v1.18+)
- **Anchor Framework** (v0.31.1)
- **Node.js** (v18+)
- **pnpm** (package manager)
- **Git**

### Installation Commands

#### 1. Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustup component add rustfmt
```

#### 2. Install Solana CLI
```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.26/install)"

# Add to PATH (add to your ~/.bashrc or ~/.zshrc)
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify installation
solana --version
```

#### 3. Install Anchor Framework
```bash
# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --tag v0.31.1 --locked --force

# Verify installation
anchor --version
```

#### 4. Install Node.js and pnpm
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm

# macOS
brew install node pnpm

# Verify installation
node --version
pnpm --version
```

## 🔧 Solana Configuration

### 1. Configure Solana for Local Development
```bash
# Set cluster to localhost (for local validator)
solana config set --url localhost

# Generate a new keypair (if you don't have one)
solana-keygen new --outfile ~/.config/solana/id.json

# Check configuration
solana config get
```

### 2. Start Local Solana Validator
```bash
# Start local validator with necessary programs
solana-test-validator \
  --bpf-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s ~/.local/share/solana/install/active_release/bin/spl_token_metadata.so \
  --reset

# In another terminal, verify validator is running
solana cluster-version
```

### 3. Fund Your Account
```bash
# Airdrop SOL to your account (for testing)
solana airdrop 10

# Check balance
solana balance
```

## 🏗️ Contract Setup

### 1. Navigate to Contracts Directory
```bash
cd community_coin_server/contracts/commcoin
```

### 2. Install Dependencies
```bash
# Install Node.js dependencies
pnpm install

# The Rust dependencies will be installed during build
```

### 3. Configure Anchor
Check that `Anchor.toml` is properly configured:

```toml
[toolchain]

[features]
resolution = true
skip-lint = false

[programs.localnet]
commcoin = "6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "localnet"
wallet = "~/.config/solana/id.json"

# Custom cluster configuration for Docker environment
[clusters.localnet]
url = "http://localhost:8899"

[[test.genesis]]
address = "6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX"
program = "target/deploy/commcoin.so"
```

## 🚀 Build and Deploy

### 1. Build the Contract
```bash
# Build the smart contract
anchor build

# This creates:
# - target/deploy/commcoin.so (the compiled program)
# - target/idl/commcoin.json (the Interface Description Language file)
```

### 2. Deploy to Local Validator
```bash
# Deploy the program
anchor deploy

# Or deploy manually with Solana CLI
solana program deploy target/deploy/commcoin.so
```

### 3. Verify Deployment
```bash
# Check if program is deployed
solana program show 6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX

# Run tests to verify functionality
anchor test --skip-local-validator
```

## 🧪 Testing

### 1. Run Unit Tests
```bash
# Run all tests (starts its own validator)
anchor test

# Run tests against existing validator
anchor test --skip-local-validator

# Run specific test file
anchor test --skip-local-validator tests/commcoin.ts
```

### 2. Interactive Testing
```bash
# Start Node.js REPL with Anchor setup
node

# In Node.js REPL:
const anchor = require('@coral-xyz/anchor');
const { Connection, PublicKey } = require('@solana/web3.js');

// Connect to local validator
const connection = new Connection('http://localhost:8899', 'confirmed');

// Load your program
const programId = new PublicKey('6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX');
```

### 3. Test with Client Integration
```bash
# Generate TypeScript types from IDL
anchor build
cp target/idl/commcoin.json ../client/client_v4/project/src/idls/

# The client can now import and use the contract
```

## 🔄 Development Workflow

### 1. Code → Build → Test Cycle
```bash
# Make changes to programs/commcoin/src/lib.rs
# Then:

anchor build      # Compile the contract
anchor deploy     # Deploy to local validator
anchor test --skip-local-validator  # Run tests
```

### 2. Debugging
```bash
# View program logs
solana logs 6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX

# View validator logs
solana-test-validator --log
```

### 3. Reset and Clean Start
```bash
# Reset local validator state
solana-test-validator --reset

# Clean build artifacts
anchor clean
anchor build
anchor deploy
```

## 📊 Contract Features

The `commcoin` program provides:

### Core Instructions
- **`initialize`** - Initialize the program
- **`create_token`** - Create a new community token
- **`mint_tokens`** - Mint tokens to users
- **`burn_tokens`** - Burn tokens from supply
- **`transfer_tokens`** - Transfer tokens between users

### Account Types
- **`TokenAccount`** - Stores token metadata and state
- **`UserAccount`** - Stores user-specific data
- **`AdminAccount`** - Stores admin privileges and settings

### Key Features
- **SPL Token Integration** - Uses Solana Program Library tokens
- **Metadata Support** - Token names, symbols, descriptions
- **Access Control** - Role-based permissions
- **Event Emission** - Logs for off-chain indexing

## 🔗 Integration Points

### With Client (`client_v4`)
- **IDL File**: `target/idl/commcoin.json` → Copy to client
- **Program ID**: `6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX`
- **RPC Endpoint**: `http://localhost:8899`

### With Server (`server_rust`)
- **Transaction Monitoring**: Server watches for program events
- **Metadata Storage**: Server stores additional token metadata
- **User Management**: Server manages user profiles and social features

## 🐛 Troubleshooting

### Common Issues

#### "Program not found" Error
```bash
# Ensure validator is running
solana cluster-version

# Check if program is deployed
solana program show 6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX

# Redeploy if needed
anchor deploy
```

#### Build Errors
```bash
# Update Rust toolchain
rustup update

# Clean and rebuild
anchor clean
anchor build

# Check Anchor version
anchor --version
# Should be v0.31.1
```

#### Test Failures
```bash
# Ensure you have enough SOL
solana balance
solana airdrop 10

# Check if validator is running
solana cluster-version

# Run tests with verbose output
anchor test --skip-local-validator -- --verbose
```

#### Connection Issues
```bash
# Check validator is listening on correct port
netstat -tulpn | grep 8899

# Verify RPC endpoint
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getVersion","params":[]}' \
  http://localhost:8899
```

## 📝 Development Tips

### 1. Program Updates
When you modify the program:
```bash
anchor build
anchor upgrade target/deploy/commcoin.so --program-id 6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX
```

### 2. Account Inspection
```bash
# View account data
solana account <ACCOUNT_ADDRESS>

# Parse account data (if you have a parser)
anchor account <ACCOUNT_TYPE> <ACCOUNT_ADDRESS>
```

### 3. Transaction Simulation
```bash
# Simulate transactions before sending
# (This is done automatically in tests)
```

## 🌐 Network Migration

### Deploy to Devnet
```bash
# Configure for devnet
solana config set --url devnet

# Airdrop SOL (limited on devnet)
solana airdrop 2

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### Deploy to Mainnet
```bash
# Configure for mainnet
solana config set --url mainnet-beta

# Deploy to mainnet (requires real SOL)
anchor deploy --provider.cluster mainnet-beta
```

## 📚 Resources

- **Anchor Book**: https://book.anchor-lang.com/
- **Solana Cookbook**: https://solanacookbook.com/
- **SPL Token Program**: https://spl.solana.com/token
- **Solana CLI Reference**: https://docs.solana.com/cli

## 📝 Next Steps

1. **Set up the server**: See `docs/SERVER_DEVELOPMENT_SETUP.md`
2. **Set up the client**: See `docs/CLIENT_DEVELOPMENT_SETUP.md`
3. **Full E2E testing**: Use `scripts/setup-localnet-e2e.sh`
4. **Production deployment**: See `docs/MULTI_CLOUD_DEPLOYMENT.md`

---

💡 **Tip**: Use the E2E setup script for automatic contract deployment with the full development stack. 