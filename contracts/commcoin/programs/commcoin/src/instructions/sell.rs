use anchor_lang::{prelude::*};

use anchor_spl::{
    associated_token::{Create as CreateIdempotent, AssociatedToken, get_associated_token_address, create_idempotent},
    token::{mint_to, set_authority, transfer as token_transfer, MintTo, Mint, Token, TokenAccount, Transfer as TokenTransfer},
};

use anchor_lang::system_program::{self, transfer as sol_transfer, Transfer as SOLTransfer};

declare_program!(commcoin);
use commcoin::program::Commcoin;

use crate::{
    states::{Config, BondingCurveState},
};



#[derive(Accounts)]
pub struct Sell<'info> {
    // Accounts for creating the token & metadata
    #[account(mut)]
    pub user: Signer<'info>, // User creating the token, pays rent

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"commcoin_bonding_curve", mint.key().as_ref()], // Seed with mint for uniqueness
        bump
    )]
    pub bonding_curve: Account<'info, BondingCurveState>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = bonding_curve,
    )]
    pub bonding_curve_token_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub user_curve_token_vault: Account<'info, TokenAccount>,


    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub program: Program<'info, Commcoin>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Sell<'info>{
    pub fn sell(&mut self, amount: u64, max_sol_cost: u64) -> Result<()> {
        let token_transfer_context = TokenTransfer {
            to: self.bonding_curve_token_vault.to_account_info(),
            from: self.user_curve_token_vault.to_account_info(),
            authority: self.user.to_account_info()
        };

        let toke_cpi_program = self.token_program.to_account_info();
        let mint_pubkey = self.mint.key();
        let mint_key_bytes: &[u8] = mint_pubkey.as_ref();

        let token_transfer_cpi_context = CpiContext::new(
            toke_cpi_program,
            token_transfer_context
        );

        token_transfer(token_transfer_cpi_context, amount)?;

        **self.bonding_curve.to_account_info().try_borrow_mut_lamports()? -= max_sol_cost;
        **self.user.to_account_info().try_borrow_mut_lamports()? += max_sol_cost;

        Ok(())

    }
}