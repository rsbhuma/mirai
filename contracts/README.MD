# 🚀 **Community Coin Smart Contracts**

Solana smart contracts for the Community Coin platform, built with Anchor framework.

## 📋 **Overview**

This directory contains the Solana smart contracts that power the Community Coin platform:

- **`commcoin`**: Main smart contract for token creation, trading, and management
- **Anchor Framework**: Version 0.31.1
- **Solana**: Compatible with Solana v1.18.26+
- **Language**: Rust with TypeScript tests

---

## 🛠️ **Prerequisites**

### **Option 1: Local Development (Recommended)**
- **Rust**: 1.86+
- **Solana CLI**: v2.1.0+
- **Anchor CLI**: 0.31.1
- **Node.js**: 20+
- **pnpm**: Latest

### **Option 2: Docker Development**
- **Docker**: Latest version
- **Docker Compose**: Latest version

---

## 🐳 **Quick Start with Docker**

### **1. Build and Run Development Environment**

```bash
# Navigate to contracts directory
cd contracts

# Build and start the development environment
docker-compose up -d

# Enter the development container
docker-compose exec solana-dev bash
```

### **2. Inside the Container**

```bash
# Navigate to the commcoin project
cd /workspace/commcoin

# Install dependencies
pnpm install

# Build the smart contract
anchor build

# Run tests
anchor test --skip-local-validator
```

---

## 💻 **Local Development Setup**

### **1. Install Solana CLI**

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/v2.1.0/install)"

# Add to PATH
export PATH="~/.local/share/solana/install/active_release/bin:$PATH"

# Verify installation
solana --version
```

### **2. Install Rust & Anchor**

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Anchor Version Manager
cargo install --git https://github.com/coral-xyz/anchor avm --force

# Install and use Anchor 0.31.1
avm install 0.31.1
avm use 0.31.1

# Verify installation
anchor --version
```

### **3. Install Node.js Dependencies**

```bash
# Install Node.js 20 (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Install pnpm
npm install -g pnpm

# Navigate to commcoin directory
cd commcoin

# Install project dependencies
pnpm install
```

---

## 🔧 **Development Workflow**

### **1. Start Solana Test Validator**

```bash
# Terminal 1: Start test validator
solana-test-validator --reset
```

### **2. Configure Solana**

```bash
# Terminal 2: Configure Solana CLI
cd contracts/commcoin

# Set cluster to localhost
solana config set --url localhost

# Create/use test keypairs (automatically created)
solana config set --keypair ~/.config/solana/id.json

# Airdrop SOL for testing
solana airdrop 10
```

### **3. Build and Test**

```bash
# Build the smart contract
anchor build

# Generate IDL and TypeScript types
anchor idl build

# Run tests
anchor test --skip-local-validator
```

### **4. Deploy to Devnet (Optional)**

```bash
# Configure for devnet
solana config set --url devnet

# Airdrop SOL on devnet
solana airdrop 2

# Deploy to devnet
anchor deploy
```

---

## 🧪 **Testing**

### **Run All Tests**

```bash
cd contracts/commcoin

# Run all tests
anchor test --skip-local-validator

# Run specific test file
anchor test --skip-local-validator tests/commcoin.ts

# Run with verbose output
anchor test --skip-local-validator -- --reporter spec
```

### **Test Structure**

```
tests/
├── commcoin.ts          # Main contract tests
└── utils/               # Test utilities
```

### **Key Test Cases**

1. **Contract Initialization**: Deploy and configure the contract
2. **Token Creation**: Create new community tokens
3. **Trading Operations**: Buy/sell token operations
4. **PDA Management**: Program Derived Address operations
5. **Access Control**: Admin and user permission tests

---

## 📁 **Project Structure**

```
contracts/
├── commcoin/                    # Main Anchor project
│   ├── programs/commcoin/       # Rust smart contract source
│   │   └── src/
│   │       ├── lib.rs          # Main program entry point
│   │       ├── instructions/   # Contract instructions
│   │       └── state/          # Program state definitions
│   ├── tests/                  # TypeScript tests
│   ├── idls/                   # Generated IDL files
│   ├── target/                 # Build artifacts
│   ├── migrations/             # Deployment scripts
│   ├── Anchor.toml            # Anchor configuration
│   ├── Cargo.toml             # Rust dependencies
│   └── package.json           # Node.js dependencies
├── setup/                      # Docker and setup files
├── test/                       # Test data and configurations
├── scripts/                    # Utility scripts
└── README.MD                   # This file
```

---

## ⚙️ **Configuration**

### **Anchor.toml Configuration**

```toml
[toolchain]
package_manager = "pnpm"

[features]
resolution = true
skip-lint = false

[programs.localnet]
commcoin = "6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX"

[provider]
cluster = "localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "pnpm ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

### **Environment Variables**

```bash
# Solana configuration
export SOLANA_URL="http://localhost:8899"
export ANCHOR_PROVIDER_URL="http://localhost:8899"
export ANCHOR_WALLET="~/.config/solana/id.json"
```

---

## 🔍 **Troubleshooting**

### **Common Issues**

#### **1. "anchor: command not found"**
```bash
# Reinstall Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install 0.31.1
avm use 0.31.1
```

#### **2. "Connection refused to localhost:8899"**
```bash
# Make sure test validator is running
solana-test-validator --reset
```

#### **3. "Insufficient funds"**
```bash
# Airdrop more SOL
solana airdrop 10
```

#### **4. "Program not deployed"**
```bash
# Rebuild and deploy
anchor build
anchor deploy
```

#### **5. Node.js version issues**
```bash
# Use correct Node.js version
nvm use 20
```

### **Reset Development Environment**

```bash
# Stop test validator
pkill solana-test-validator

# Clean build artifacts
cd contracts/commcoin
anchor clean

# Reset validator ledger
solana-test-validator --reset --quiet &

# Rebuild everything
anchor build
anchor test --skip-local-validator
```

---

## 📚 **Smart Contract Features**

### **Core Functionality**

1. **Token Creation**
   - Create new community tokens
   - Set token metadata (name, symbol, supply)
   - Configure bonding curve parameters

2. **Trading System**
   - Buy/sell tokens with SOL
   - Automated market maker (AMM) pricing
   - Slippage protection

3. **Access Control**
   - Admin-only functions
   - User permission management
   - Emergency pause functionality

4. **Fee Management**
   - Trading fees collection
   - Revenue distribution
   - Platform fee configuration

### **Program Instructions**

- `initialize`: Initialize the program
- `create_token`: Create a new community token
- `buy_tokens`: Purchase tokens with SOL
- `sell_tokens`: Sell tokens for SOL
- `configure`: Admin configuration updates

---

## 🚀 **Deployment**

### **Devnet Deployment**

```bash
# Configure for devnet
solana config set --url devnet

# Build program
anchor build

# Deploy to devnet
anchor deploy

# Verify deployment
solana program show <PROGRAM_ID>
```

### **Mainnet Deployment**

```bash
# Configure for mainnet
solana config set --url mainnet-beta

# Build program (production optimizations)
anchor build --release

# Deploy to mainnet (requires sufficient SOL)
anchor deploy

# Verify deployment
solana program show <PROGRAM_ID>
```

---

## 🔗 **References**

- **Anchor Documentation**: https://www.anchor-lang.com/
- **Solana Documentation**: https://docs.solana.com/
- **SPL Token Program**: https://spl.solana.com/token
- **Solana Cookbook**: https://solanacookbook.com/

---

## 🤝 **Contributing**

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/new-feature`
3. **Make changes and test**: `anchor test --skip-local-validator`
4. **Commit changes**: `git commit -m "Add new feature"`
5. **Push to branch**: `git push origin feature/new-feature`
6. **Create Pull Request**

---

## 📝 **License**

This project is licensed under the ISC License.

---

## 🆘 **Support**

For issues and questions:
1. Check the troubleshooting section above
2. Review Anchor/Solana documentation
3. Create an issue in the repository
4. Join the community Discord/Telegram

---

**Happy Building! 🚀**





