use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer as SplTransfer},
};

// Replace with your program ID after deployment
declare_id!("VaultStk11111111111111111111111111111111111");

// --- Seeds for PDAs ---
const VAULT_CONFIG_SEED: &[u8] = b"vault_config_v1";
const VAULT_TOKEN_SEED: &[u8] = b"vault_tokens_v1";
const USER_STAKE_INFO_SEED: &[u8] = b"user_stake_v1";

#[program]
pub mod community_vault {
    use super::*;

    /// Initializes the community vault with a specific goal.
    /// The vault_creator becomes the initial authority for managing the goal (optional).
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        goal_tokens_to_reach: u64,
        vault_name: String, // Max 50 chars for space calculation
    ) -> Result<()> {
        require!(goal_tokens_to_reach > 0, VaultError::GoalCannotBeZero);
        require!(vault_name.len() <= 50 && vault_name.len() > 0, VaultError::InvalidVaultName);

        let vault_config = &mut ctx.accounts.vault_config;
        vault_config.name = vault_name;
        vault_config.authority = ctx.accounts.vault_creator.key();
        vault_config.token_mint = ctx.accounts.token_mint.key();
        vault_config.vault_token_account = ctx.accounts.vault_token_account.key();
        vault_config.goal_tokens_to_reach = goal_tokens_to_reach;
        vault_config.current_tokens_staked = 0;
        vault_config.goal_reached = false;
        vault_config.bump_config = ctx.bumps.vault_config;
        vault_config.bump_token_vault = ctx.bumps.vault_token_account;


        msg!("Vault '{}' initialized by {}", vault_config.name, vault_config.authority);
        msg!("Token Mint: {}", vault_config.token_mint);
        msg!("Vault Token Account: {}", vault_config.vault_token_account);
        msg!("Goal to reach: {} tokens", vault_config.goal_tokens_to_reach);
        Ok(())
    }

    /// Allows a user to stake tokens into the vault.
    pub fn stake_tokens(ctx: Context<StakeTokens>, amount_to_stake: u64) -> Result<()> {
        require!(amount_to_stake > 0, VaultError::StakeAmountMustBePositive);

        let vault_config = &mut ctx.accounts.vault_config;
        let user_stake_info = &mut ctx.accounts.user_stake_info;

        // Transfer tokens from user's ATA to the vault's token account (PDA)
        let cpi_accounts = SplTransfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.staker.to_account_info(), // Staker signs for their tokens
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_context, amount_to_stake)?;

        // Update user's stake info
        user_stake_info.staker = ctx.accounts.staker.key();
        user_stake_info.vault_config = vault_config.key();
        user_stake_info.amount_staked += amount_to_stake; // Accumulate stake
        user_stake_info.bump = ctx.bumps.user_stake_info;


        // Update vault's total staked amount
        vault_config.current_tokens_staked += amount_to_stake;

        msg!(
            "User {} staked {} tokens. New total stake for user: {}. Vault total: {}",
            user_stake_info.staker,
            amount_to_stake,
            user_stake_info.amount_staked,
            vault_config.current_tokens_staked
        );

        // Check if goal is reached
        if !vault_config.goal_reached && vault_config.current_tokens_staked >= vault_config.goal_tokens_to_reach {
            vault_config.goal_reached = true;
            msg!("VAULT GOAL REACHED! Current staked: {}, Goal: {}", vault_config.current_tokens_staked, vault_config.goal_tokens_to_reach);
            // Emit an event or further actions can be triggered here
            emit!(VaultGoalReached {
                vault_config: vault_config.key(),
                total_staked_at_goal: vault_config.current_tokens_staked,
            });
        }

        Ok(())
    }

    /// Allows a user to request a refund (unstake) of their tokens.
    /// This example allows refund only if the goal has been reached.
    pub fn refund_tokens(ctx: Context<RefundTokens>, amount_to_refund: u64) -> Result<()> {
        require!(amount_to_refund > 0, VaultError::RefundAmountMustBePositive);

        let vault_config = &mut ctx.accounts.vault_config;
        let user_stake_info = &mut ctx.accounts.user_stake_info;

        // Rule: Can only refund if the goal has been reached
        require!(vault_config.goal_reached, VaultError::GoalNotReached);

        // Rule: User cannot refund more than they have staked
        require!(
            user_stake_info.amount_staked >= amount_to_refund,
            VaultError::InsufficientStakeForRefund
        );

        // Transfer tokens from the vault's token account (PDA) back to the user's ATA
        // The program signs for the PDA transfer using seeds.
        let vault_name_bytes = vault_config.name.as_bytes();
        let seeds = &[
            VAULT_TOKEN_SEED,
            vault_config.token_mint.as_ref(),
            vault_name_bytes.as_ref(),
            &[vault_config.bump_token_vault], // Bump for the vault_token_account PDA
        ];
        let signer_seeds = &[&seeds[..]][..];

        let cpi_accounts = SplTransfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.vault_token_account.to_account_info(), // PDA is the authority
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_context, amount_to_refund)?;

        // Update user's stake info
        user_stake_info.amount_staked -= amount_to_refund;

        // Update vault's total staked amount
        vault_config.current_tokens_staked -= amount_to_refund;

        msg!(
            "User {} refunded {} tokens. Remaining stake for user: {}. Vault total: {}",
            user_stake_info.staker,
            amount_to_refund,
            user_stake_info.amount_staked,
            vault_config.current_tokens_staked
        );

        Ok(())
    }

    // Optional: Instruction for vault authority to update the goal (e.g., if initial goal too high/low)
    // This would require proper checks and potentially a different authority mechanism.
    // pub fn update_goal(ctx: Context<UpdateGoal>, new_goal: u64) -> Result<()> {
    //     require!(new_goal > 0, VaultError::GoalCannotBeZero);
    //     let vault_config = &mut ctx.accounts.vault_config;
    //     // require!(vault_config.authority == ctx.accounts.authority.key(), VaultError::Unauthorized);
    //     vault_config.goal_tokens_to_reach = new_goal;
    //     msg!("Vault goal updated to: {}", new_goal);
    //     Ok(())
    // }
}

// --- Account Structs ---

#[derive(Accounts)]
#[instruction(goal_tokens_to_reach: u64, vault_name: String)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = vault_creator,
        space = VaultConfig::LEN,
        seeds = [VAULT_CONFIG_SEED, token_mint.key().as_ref(), vault_name.as_bytes()],
        bump
    )]
    pub vault_config: Account<'info, VaultConfig>,

    #[account(
        init,
        payer = vault_creator,
        token::mint = token_mint,
        token::authority = vault_token_account, // PDA itself is the authority
        seeds = [VAULT_TOKEN_SEED, token_mint.key().as_ref(), vault_name.as_bytes()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>, // PDA to hold staked tokens

    pub token_mint: Account<'info, Mint>, // The mint of the token to be staked

    #[account(mut)]
    pub vault_creator: Signer<'info>, // User initializing the vault

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount_to_stake: u64)]
pub struct StakeTokens<'info> {
    #[account(mut)] // To update current_tokens_staked and goal_reached
    pub vault_config: Account<'info, VaultConfig>,

    #[account(
        mut,
        // Vault token account must match the one in vault_config
        constraint = vault_token_account.key() == vault_config.vault_token_account @ VaultError::InvalidVaultTokenAccount,
        // Ensure the mint matches
        constraint = vault_token_account.mint == vault_config.token_mint @ VaultError::MintMismatch
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed, // Create UserStakeInfo if it's their first time staking
        payer = staker,
        space = UserStakeInfo::LEN,
        seeds = [USER_STAKE_INFO_SEED, staker.key().as_ref(), vault_config.key().as_ref()],
        bump
    )]
    pub user_stake_info: Account<'info, UserStakeInfo>,

    // User's token account from which they are staking
    #[account(
        mut,
        // Ensure it's for the correct mint
        constraint = user_token_account.mint == vault_config.token_mint @ VaultError::MintMismatch
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub staker: Signer<'info>, // User performing the stake

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>, // For init_if_needed
}

#[derive(Accounts)]
#[instruction(amount_to_refund: u64)]
pub struct RefundTokens<'info> {
    #[account(mut)] // To update current_tokens_staked
    pub vault_config: Account<'info, VaultConfig>,

    #[account(
        mut,
        // Vault token account must match the one in vault_config
        constraint = vault_token_account.key() == vault_config.vault_token_account @ VaultError::InvalidVaultTokenAccount,
        constraint = vault_token_account.mint == vault_config.token_mint @ VaultError::MintMismatch
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        // User must have stake info, and it must be for this vault
        seeds = [USER_STAKE_INFO_SEED, staker.key().as_ref(), vault_config.key().as_ref()],
        bump = user_stake_info.bump, // Use the stored bump for verification
        constraint = user_stake_info.staker == staker.key() @ VaultError::StakeInfoMismatch,
        constraint = user_stake_info.vault_config == vault_config.key() @ VaultError::StakeInfoMismatch
    )]
    pub user_stake_info: Account<'info, UserStakeInfo>,

    // User's token account to receive the refunded tokens
    #[account(
        mut,
        // Ensure it's for the correct mint
        constraint = user_token_account.mint == vault_config.token_mint @ VaultError::MintMismatch
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    // User requesting the refund (must be the original staker)
    pub staker: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

// --- State Structs ---

#[account]
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
    // Calculate space: String prefix (4) + string length (50) + Pubkey (32*3) + u64 (8*2) + bool (1) + u8 (1*2) + Anchor Discriminator (8)
    const LEN: usize = 8 + (4 + 50) + (32 * 3) + (8 * 2) + 1 + (1 * 2);
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

// --- Events ---
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

// Define the program type struct (good practice for CPIs if this program is called by others)
#[derive(Clone)]
pub struct CommunityVault;
