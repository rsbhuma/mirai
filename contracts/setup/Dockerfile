# Use Ubuntu 22.04 LTS as base
FROM ubuntu:22.04

# Avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Set environment variables for Rust
ENV RUSTUP_HOME=/usr/local/rustup
ENV CARGO_HOME=/usr/local/cargo
ENV PATH=/usr/local/cargo/bin:$PATH

# Install system dependencies (including libudev for hidapi)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        wget \
        build-essential \
        ca-certificates \
        gcc \
        libc6-dev \
        pkg-config \
        libssl-dev \
        libudev-dev \
        git \
        vim \
        nano \
        htop \
        procps \
        bc \
        && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | \
    sh -s -- -y --default-toolchain stable --profile default --no-modify-path && \
    rustup toolchain install 1.86 --profile default && \
    rustup default 1.86 && \
    rm -rf ${RUSTUP_HOME}/tmp && \
    rm -rf ${CARGO_HOME}/registry/index/* ${CARGO_HOME}/registry/cache/* ${CARGO_HOME}/git/db/*

# Install Solana CLI
RUN sh -c "$(curl -sSfL https://release.anza.xyz/v2.1.0/install)" && \
    echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc

# Add Solana to PATH
ENV PATH="/root/.local/share/solana/install/active_release/bin:$PATH"

# Install Node.js using NodeSource repository
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Install pnpm globally
RUN npm install -g pnpm

# Install Anchor directly from source (more reliable than AVM)
RUN cargo install --git https://github.com/coral-xyz/anchor anchor-cli --tag v0.31.1 --locked --force

# Verify installations
RUN echo "=== Installation Verification ===" && \
    echo "Rust version:" && rustc --version && \
    echo "Cargo version:" && cargo --version && \
    echo "Solana version:" && solana --version && \
    echo "Anchor version:" && anchor --version && \
    echo "Node.js version:" && node --version && \
    echo "npm version:" && npm --version && \
    echo "pnpm version:" && pnpm --version

# Set working directory
WORKDIR /workspace

# Create a startup script
RUN echo '#!/bin/bash\n\
echo "🚀 Solana Development Environment Ready!"\n\
echo ""\n\
echo "📋 Available Tools:"\n\
echo "  - Rust $(rustc --version | cut -d\" \" -f2)"\n\
echo "  - Solana CLI $(solana --version | cut -d\" \" -f2)"\n\
echo "  - Anchor $(anchor --version | cut -d\" \" -f3)"\n\
echo "  - Node.js $(node --version)"\n\
echo "  - pnpm $(pnpm --version)"\n\
echo ""\n\
echo "🔧 Quick Commands:"\n\
echo "  cd commcoin          # Navigate to project"\n\
echo "  pnpm install         # Install dependencies"\n\
echo "  anchor build         # Build smart contract"\n\
echo "  anchor test --skip-local-validator  # Run tests"\n\
echo ""\n\
echo "💡 Solana validator is running at: http://solana-validator:8899"\n\
echo ""\n\
# Configure Solana to use the validator service (wait a moment for network to be ready)\n\
sleep 2\n\
solana config set --url http://solana-validator:8899 > /dev/null 2>&1 || echo "Note: Will configure Solana URL when validator is ready"\n\
exec "$@"' > /usr/local/bin/entrypoint.sh && \
    chmod +x /usr/local/bin/entrypoint.sh

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Default command
CMD ["bash"]