use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::{AccountMeta, Instruction},
    program::invoke, // Import invoke
    pubkey::Pubkey,
};

use anchor_spl::{
    associated_token::{Create as CreateIdempotent, AssociatedToken, get_associated_token_address, create_idempotent},
    token::{mint_to, set_authority, MintTo, Mint, Token, TokenAccount, SetAuthority, spl_token::instruction::AuthorityType},
};

// use spl_associated_token_account::instruction::create_associated_token_account;

// declare_program!(commcoin);
// use commcoin::cpi::rope_account;
// use commcoin::cpi::accounts::RopeAccount;
// use commcoin::program::Commcoin;

use crate::{
    states::{Config, BondingCurveState, VaultConfig},
};

// use crate::instructions::ExtendAccount;
use std::io::Write; 

const TOKEN_DECIMALS: u8 = 6; // Example: 9 decimals for 1B supply
const LAMPORTS_PER_SOL: f64 = 1_000_000_000.0;
const TOTAL_SUPPLY: u64 = 1_000_000_000 * (10u64.pow(TOKEN_DECIMALS as u32)); // 1 Billion base units
const PLATFORM_FEE_BPS: u16 = 100; // Basis points (100 = 1%)
const INITIAL_SOL_RESERVE: f64 = 29.916123;

const VAULT_CONFIG_SEED: &[u8] = b"vault_config_v1";
const VAULT_TOKEN_SEED: &[u8] = b"vault_tokens_v1";
const USER_STAKE_INFO_SEED: &[u8] = b"user_stake_v1";

// !!! IMPORTANT: REPLACE THIS WITH THE ACTUAL PUBLIC KEY THAT SHOULD BE THE FINAL MINT AUTHORITY !!!
// This is a placeholder address (the default system program ID).
// Replace it with the public key you want to control minting permanently.
// const FIXED_MINT_AUTHORITY_PUBKEY: Pubkey = pubkey!("EJdcnkTKogTPuRDj3QZMYNUxCinjtYnERzmk65yjvDkC");


#[derive(Accounts)]
pub struct CreateCoinInfo<'info> {
    // Accounts for creating the token & metadata
    #[account(mut)]
    pub signer: Signer<'info>, // User creating the token, pays rent

    #[account(
        mut,
        seeds = [b"commcoin_bonding_curve", b"commcoin_random_minted"], // Seed with mint for uniqueness
        bump
    )]
    pub mint_authority: Account<'info, Config>,

    #[account(
        init,
        payer = signer,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = mint_authority.key(), // Payer is TEMP mint authority
        // mint::creator = signer.key(),
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = signer,
        space = VaultConfig::LEN,
        seeds = [VAULT_CONFIG_SEED, mint.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, VaultConfig>,

    #[account(
        init,
        payer = signer,
        token::mint = mint,
        token::authority = vault, // PDA itself is the authority
        seeds = [VAULT_TOKEN_SEED, mint.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>, // PDA to hold staked tokens

    // Accounts for the bonding curve state and vaults
    #[account(
        init,
        payer = signer,
        space = BondingCurveState::LEN,
        owner = crate::ID,
        seeds = [b"commcoin_bonding_curve", mint.key().as_ref()], // Seed with mint for uniqueness
        bump
    )]
    pub bonding_curve: Account<'info, BondingCurveState>,

    #[account(
        init,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = bonding_curve, // PDA owns the token vault
        // seeds = [b"token_vault", mint.key().as_ref()], // Seed for vault PDA address
    )]
    pub bonding_curve_token_vault: Account<'info, TokenAccount>,

    

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,

}

impl<'info> CreateCoinInfo<'info>{

    pub fn create_coin(&mut self, bump_config: u8, vault_bump: u8, vault_token_bump: u8) -> Result<()> {

        let bonding_curve_state = &mut self.bonding_curve;

        bonding_curve_state.real_token_reserves = TOTAL_SUPPLY;

        bonding_curve_state.virtual_token_reserves = TOTAL_SUPPLY;
        bonding_curve_state.virtual_sol_reserves = (INITIAL_SOL_RESERVE * LAMPORTS_PER_SOL) as u64;
        let vault_name = "Stacked Community";

        let vault_config = &mut self.vault;
        vault_config.name = vault_name.to_string();
        vault_config.authority = self.signer.key();
        vault_config.token_mint = self.mint.key();
        vault_config.vault_token_account = self.vault_token_account.key();
        vault_config.goal_tokens_to_reach = 80;
        vault_config.current_tokens_staked = 0;
        vault_config.goal_reached = false;
        vault_config.bump_config = vault_bump;
        vault_config.bump_token_vault = vault_token_bump;


        let signer_seeds: &[&[&[u8]]] = &[&[b"commcoin_bonding_curve", b"commcoin_random_minted", &[bump_config]]];

        mint_to(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                MintTo {
                    mint: self.mint.to_account_info(),
                    to: self.bonding_curve_token_vault.to_account_info(),
                    authority: self.mint_authority.to_account_info(), // Payer signs as temp mint authority
                },
                signer_seeds
            ),
            TOTAL_SUPPLY,
        )?;

        set_authority(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                SetAuthority {
                    current_authority: self.mint_authority.to_account_info(), // The account that currently HAS mint authority
                    account_or_mint: self.mint.to_account_info(), // The mint account whose authority we are changing
                },
                signer_seeds
            ),
            AuthorityType::MintTokens, 
            None
        )?;

        msg!("Instruction: Create Token With Curve");
        msg!("Signer: {}", self.signer.key());
        msg!("New Mint: {}", self.mint.key());
        
        Ok(())
    }
}