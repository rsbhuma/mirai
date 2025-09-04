use anchor_lang::prelude::*;

pub mod instructions;
pub mod states;

use crate::instructions::*;

declare_id!("6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX");

#[program]
pub mod commcoin {
    use super::*;

    pub fn configure(ctx: Context<Configure>, new_config: states::Config) -> Result<()> {
        ctx.accounts.process(new_config)
    }

   
    //  called by a creator to launch a token on the platform
    pub fn extend_account<'info>(
        ctx: Context<'_, '_, '_, 'info, ExtendAccount<'info>>,
    ) -> Result<()> {
        ctx.accounts
            .extend_account()
    }

    //  called by a creator to launch a token on the platform
    pub fn alloc_account<'info>(
        ctx: Context<'_, '_, '_, 'info, Realloc<'info>>,
    ) -> Result<()> {
        ctx.accounts
            .realloc_account()
    }

    //  called by a creator to launch a token on the platform
    pub fn paint_account<'info>(
        ctx: Context<'_, '_, '_, 'info, Pantru<'info>>,
    ) -> Result<()> {
        ctx.accounts
            .paint_account()
    }

    pub fn rope_account<'info>(
        ctx: Context<'_, '_, '_, 'info, Rope<'info>>,
    ) -> Result<()> {
        ctx.accounts
            .rope_now()
    }


     //  called by a creator to launch a token on the platform
    pub fn create_coin<'info>(
        ctx: Context<'_, '_, '_, 'info, CreateCoinInfo<'info>>,
    ) -> Result<()> {
        // msg!("New Mint: {}", ctx.cpi);
        // msg!("New Mint: {}", ctx.accounts.extend_account.ExtendAccount);
        // crate::cpi::configure({});

        ctx.accounts
            .create_coin(ctx.bumps.mint_authority, ctx.bumps.vault, ctx.bumps.vault_token_account)
    }

    pub fn buy<'info>(
        ctx: Context<'_, '_, '_, 'info, Buy<'info>>, amount: u64, max_sol_cost: u64
    ) -> Result<()> {
        // msg!("New Mint: {}", ctx.cpi);
        // msg!("New Mint: {}", ctx.accounts.extend_account.ExtendAccount);
        // crate::cpi::configure({});

        ctx.accounts
            .buy(amount, max_sol_cost, ctx.bumps.bonding_curve)
    }

     pub fn sell<'info>(
        ctx: Context<'_, '_, '_, 'info, Sell<'info>>, amount: u64, max_sol_cost: u64
    ) -> Result<()> {
        // msg!("New Mint: {}", ctx.cpi);
        // msg!("New Mint: {}", ctx.accounts.extend_account.ExtendAccount);
        // crate::cpi::configure({});

        ctx.accounts
            .sell(amount, max_sol_cost)
    }
}
