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
use anchor_lang::system_program::{self, Transfer, Allocate};


use crate::{
    states::{Config, BondingCurveState},
};


#[derive(Accounts)]
pub struct Rope<'info> {
     // Accounts for creating the token & metadata
    #[account(mut)]
    pub user: Signer<'info>, // User creating the token, pays rent

    /// CHECK: this is account to transfer
    #[account(
        mut,
    )]
    pub baccount: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> Rope<'info> {
    pub fn rope_now(&mut self) -> Result<()> {

        let account_to_realloc = &self.baccount;
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
                    to: self.baccount.clone(),     // Account receiving SOL
                }
            );
            system_program::transfer(cpi_context, lamports_diff)?;
        } else {
            msg!("Account already has sufficient lamports for new size.");
        }

        self.baccount.realloc(new_size, false);

        // let program_key: Pubkey =  self.program.key();
// Or if using AccountInfo: let program_key: &Pubkey = ctx.accounts.current_program.key;



        // let signer_seeds: &[&[&[u8]]] = &[&[b"commcoin_bonding_curve", program_key.as_ref(), &[bump_config]]];

        // invoke_signed(
        //     &system_instruction::reallocate(
        //         self.baccount.key(), // Account address to reallocate
        //         new_size as usize,     // New data length
        //     )?,
        //     &[ // Accounts needed by system_instruction::reallocate
        //         self.baccount.clone(), // The account being reallocated (writable)
        //         self.system_program.to_account_info(), // System program
        //     ],
        //     signer_seeds, // Program signs for the PDA it owns
        // )?;

        // let space_cpi_context = CpiContext::new_with_signer(
        //     system_program.to_account_info(),
        //     Allocate {
        //         account_to_allocate: self.baccount.clone(),// Account sending SOL
        //     },
        //     signer_seeds
        // );
        // system_program::allocate(space_cpi_context, new_size as u64);


        Ok(())
    }
}