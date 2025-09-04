# 1. Make sure Solana CLI is set to localnet
solana config set --url localhost

# 2. Deploy the program (if not already done) - This requires anchor build first
# anchor deploy # This will output the program ID

# 3. Ensure your Anchor.toml points to the correct program ID and cluster
# [programs.localnet]
# token_creation = "DhwjL6dwkHLKm2c1mrgVVGXmgYmeScbTkwvNEij6cZWt" # Program ID
#
# [provider]
# cluster = "localnet"
# wallet = "~/.config/solana/id.json" # Your payer wallet

# 4. Invoke the instruction using Anchor CLI
anchor invoke --program-id DhwjL6dwkHLKm2c1mrgVVGXmgYmeScbTkwvNEij6cZWt initialize -v

# OR if configured in Anchor.toml
# anchor invoke token_creation initialize -v