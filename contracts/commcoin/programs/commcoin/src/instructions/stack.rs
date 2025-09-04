use anchor_lang::{prelude::*};

use anchor_spl::{
    associated_token::{Create as CreateIdempotent, AssociatedToken, get_associated_token_address, create_idempotent},
    token::{mint_to, set_authority, transfer as token_transfer, MintTo, Mint, Token, TokenAccount, Transfer as TokenTransfer},
};

use anchor_lang::system_program::{self, transfer as sol_transfer, Transfer as SOLTransfer};

// declare_program!(commcoin);
// use commcoin::program::Commcoin;

use crate::{
    states::{Config, BondingCurveState, VaultConfig, UserStakeInfo, VaultGoalReached, VaultError},
};

const USER_STAKE_INFO_SEED: &[u8] = b"user_stake_v1";



#[derive(Accounts)]
pub struct Stack<'info> {
    // Accounts for creating the token & metadata
    #[account(mut)]
    pub user: Signer<'info>, // User creating the token, pays rent

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)] // To update current_tokens_staked and goal_reached
    pub vault: Account<'info, VaultConfig>,

    #[account(
        mut,
        // Vault token account must match the one in vault_config
        constraint = vault_token_account.key() == vault.vault_token_account @ VaultError::InvalidVaultTokenAccount,
        // Ensure the mint matches
        constraint = vault_token_account.mint == vault.token_mint @ VaultError::MintMismatch
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

   #[account(
        init_if_needed, // Create UserStakeInfo if it's their first time staking
        payer = user,
        space = UserStakeInfo::LEN,
        seeds = [USER_STAKE_INFO_SEED, user.key().as_ref(), vault.key().as_ref()],
        bump
    )]
    pub user_stake_info: Account<'info, UserStakeInfo>,


    // User's token account from which they are staking
    #[account(
        mut,
        // Ensure it's for the correct mint
        constraint = user_token_account.mint == vault.token_mint @ VaultError::MintMismatch
    )]
    pub user_token_account: Account<'info, TokenAccount>,


    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Stack<'info>{
    pub fn stake(&mut self, amount: u64, user_stack_info_bump: u8) -> Result<()> {
        
        let vault_config = &mut self.vault;
        let user_stake_info = &mut self.user_stake_info;

        // Transfer tokens from user's ATA to the vault's token account (PDA)
        let cpi_accounts = TokenTransfer {
            from: self.user_token_account.to_account_info(),
            to: self.vault_token_account.to_account_info(),
            authority: self.user.to_account_info(), // Staker signs for their tokens
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        token_transfer(cpi_context, amount_to_stake)?;

        // Update user's stake info
        user_stake_info.staker = self.user.key();
        user_stake_info.vault_config = vault_config.key();
        user_stake_info.amount_staked += amount_to_stake; // Accumulate stake
        user_stake_info.bump = user_stack_bump;


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
}