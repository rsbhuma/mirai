use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{mint_to, set_authority, MintTo, Mint, Token, TokenAccount, SetAuthority, spl_token::instruction::AuthorityType},
};
use anchor_lang::solana_program::{
    program::invoke_signed, // For calling reallocate
    system_instruction,     // For building the reallocate instruction
    sysvar::{rent::Rent, Sysvar}, // For rent calculation
};
use anchor_lang::system_program::{self, Transfer};

use crate::{
    states::{Config, BondingCurveState},
};


#[derive(Accounts)]
pub struct Realloc<'info> {
     // Accounts for creating the token & metadata
    #[account(mut)]
    pub user: Signer<'info>, // User creating the token, pays rent

    /// CHECK: this is account to transfer
    #[account(
        mut,
        realloc = 256,
        realloc::payer = user,
        realloc::zero = false,
    )]
    pub curve_account: Account<'info, BondingCurveState>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Realloc<'info> {
    pub fn realloc_account(&mut self) -> Result<()> {

        let account_to_realloc = self.curve_account.to_account_info();
        let payer = &self.user;
        let system_program = &self.system_program;

        let current_size = account_to_realloc.data_len();
        let new_size = 256; // Calculate desired new size

        let rent = Rent::get()?;
        let new_minimum_balance = rent.minimum_balance(new_size);
        let current_balance = account_to_realloc.lamports();

        let lamports_diff = new_minimum_balance.saturating_sub(current_balance);

        if lamports_diff > 0 {
            let cpi_context = CpiContext::new(
                system_program.to_account_info(),
                Transfer {
                    from: payer.to_account_info(), // Account sending SOL
                    to: account_to_realloc,     // Account receiving SOL
                }
            );
            system_program::transfer(cpi_context, lamports_diff)?;
        } else {
            msg!("Account already has sufficient lamports for new size.");
        }


        Ok(())
    }
}