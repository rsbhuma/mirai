use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct VaultConfig {
    pub name: String,                // Max 50 chars, e.g. "My Community Vault"
    pub authority: Pubkey,           // Pubkey that can manage the vault (e.g., update goal - optional)
    pub token_mint: Pubkey,          // Mint of the token being staked
    pub vault_token_account: Pubkey, // PDA holding all staked tokens
    pub goal_tokens_to_reach: u64,   // The target amount of tokens to be staked
    pub current_tokens_staked: u64,  // Current total tokens staked in this vault
    pub goal_reached: bool,          // Flag indicating if the goal has been met
    pub bump_config: u8,             // Bump seed for this VaultConfig PDA
    pub bump_token_vault: u8,        // Bump seed for the vault_token_account PDA
}

impl VaultConfig {
    // Calculate space needed for the account
    // 8 (discriminator) + 32 (mint) + 32 (creator) + 8*4 (reserves) + 1 (bump) + padding/future fields
    pub const LEN: usize = 8 + (4 + 50) + (32 * 3) + (8 * 2) + 1 + (1 * 2);
}

#[account]
pub struct UserStakeInfo {
    pub staker: Pubkey,         // The user who staked
    pub vault_config: Pubkey,   // Reference to the vault they staked in
    pub amount_staked: u64,     // Total amount this user has staked
    pub bump: u8,               // Bump seed for this UserStakeInfo PDA
}

impl UserStakeInfo {
    // Calculate space: Pubkey (32*2) + u64 (8) + u8 (1) + Anchor Discriminator (8)
    const LEN: usize = 8 + (32 * 2) + 8 + 1;
}

#[event]
pub struct VaultGoalReached {
    pub vault_config: Pubkey,
    pub total_staked_at_goal: u64,
}

// --- Errors ---
#[error_code]
pub enum VaultError {
    #[msg("Stake amount must be greater than zero.")]
    StakeAmountMustBePositive,
    #[msg("Refund amount must be greater than zero.")]
    RefundAmountMustBePositive,
    #[msg("The vault goal has not been reached yet.")]
    GoalNotReached,
    #[msg("User does not have enough staked tokens for this refund amount.")]
    InsufficientStakeForRefund,
    #[msg("The vault token account provided is invalid.")]
    InvalidVaultTokenAccount,
    #[msg("Token mint mismatch.")]
    MintMismatch,
    #[msg("User stake info does not match the staker or vault.")]
    StakeInfoMismatch,
    #[msg("Vault goal cannot be zero.")]
    GoalCannotBeZero,
    #[msg("Vault name is invalid (empty or too long).")]
    InvalidVaultName,
}