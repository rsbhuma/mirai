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
pub struct Buy<'info> {
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

impl<'info> Buy<'info>{
    pub fn buy(&mut self, amount: u64, max_sol_cost: u64, bump_config: u8) -> Result<()> {
        let token_transfer_context = TokenTransfer {
            from: self.bonding_curve_token_vault.to_account_info(),
            to: self.user_curve_token_vault.to_account_info(),
            authority: self.bonding_curve.to_account_info()
        };

        let toke_cpi_program = self.token_program.to_account_info();
        let mint_pubkey = self.mint.key();
        let mint_key_bytes: &[u8] = mint_pubkey.as_ref();
        let signer_seeds: &[&[&[u8]]] = &[&[b"commcoin_bonding_curve", mint_key_bytes, &[bump_config]]];
        let token_transfer_cpi_context = CpiContext::new_with_signer(
            toke_cpi_program,
            token_transfer_context,
            signer_seeds
        );

        token_transfer(token_transfer_cpi_context, amount)?;

        let curve_account = max_sol_cost.saturating_sub(max_sol_cost*0.1 as u64);
        
        let sol_transfer_cpi_context = CpiContext::new(
            self.system_program.to_account_info(),
            SOLTransfer {
                from: self.user.to_account_info(), // Account sending SOL
                to: self.bonding_curve.to_account_info(),     // Account receiving SOL
            }
        );
        sol_transfer(sol_transfer_cpi_context, curve_account)?;

        Ok(())

    }
}