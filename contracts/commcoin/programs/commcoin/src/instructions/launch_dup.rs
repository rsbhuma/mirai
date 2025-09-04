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
        token::authority = vault_config, // PDA itself is the authority
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

    pub fn create_coin(&mut self, bump_config: u8) -> Result<()> {

        msg!("FIRST 11");

        let bonding_curve_state = &mut self.bonding_curve;

        bonding_curve_state.real_token_reserves = TOTAL_SUPPLY;

        bonding_curve_state.virtual_token_reserves = TOTAL_SUPPLY;
        bonding_curve_state.virtual_sol_reserves = (INITIAL_SOL_RESERVE * LAMPORTS_PER_SOL) as u64;


         msg!("FIRST 22");

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


         msg!("FIRST 33");

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

         msg!("FIRST 44");

        
        // let cpi_context = CpiContext::new(
        //     self.program.to_account_info(), 
        //     RopeAccount {
        //         user: self.signer.to_account_info(),
        //         baccount: self.bonding_curve.to_account_info(),
        //         program: self.program.to_account_info(),
        //         system_program: self.system_program.to_account_info(),
        //     },
        // );

        // rope_account(cpi_context);

        msg!("FIRST 55");

        // // 1. Derive the ATA address (optional but good practice to log/verify)
        // let derived_ata_address = get_associated_token_address(
        //     &self.signer.key(),
        //     &self.mint.key()
        // );
        // msg!("Derived ATA address: {}", derived_ata_address);

        // let cpi_accounts = CreateIdempotent {
        //     payer: self.signer.to_account_info(),
        //     // The ATA account info. Marked mut as it will be created/initialized.
        //     // Pass the AccountInfo from the context.
        //     associated_token: self.user_token_account.to_account_info(),
        //     authority: self.signer.to_account_info(),
        //     mint: self.mint.to_account_info(),
        //     system_program: self.system_program.to_account_info(),
        //     token_program: self.token_program.to_account_info(),
        //     // Note: Rent sysvar is usually handled implicitly by the Associated Token Program
        // };

        //   // 3. Get the Associated Token Program's AccountInfo
        // let cpi_program = self.associated_token_program.to_account_info();

        // // 4. Create the CpiContext
        // let cpi_context = CpiContext::new(cpi_program, cpi_accounts);

        // create_idempotent(cpi_context)?;




        



        // msg!(self.signer.key().to_string().as_str());
        // msg!(self.mint.key().to_string().as_str());
        // msg!(self.token_program.key().to_string().as_str());

        // let ata_instruction = create_associated_token_account(
        //     &self.signer.key(),
        //     &self.signer.key(),
        //     &self.mint.key(),
        //     &self.token_program.key(),
        // );

        // msg!("--- Instruction Details for Manual Invoke ---");
        // msg!("Program ID: {}", ata_instruction.program_id);

        // msg!("Accounts Metas ({}):", ata_instruction.accounts.len());
        // for (i, meta) in ata_instruction.accounts.iter().enumerate() {
        //     msg!(
        //         "  Account {}: Pubkey={}, IsSigner={}, IsWritable={}",
        //         i,
        //         meta.pubkey,
        //         meta.is_signer,
        //         meta.is_writable
        //     );
        // }

        // // Use debug print {:?} for the byte vector data
        // msg!("Instruction Data (Bytes): {:?}", ata_instruction.data);
        // msg!("--- End Instruction Details ---");

        // let account_infos_for_invoke = &[
        //     self.signer.to_account_info(),
        //     // self.signer.to_account_info(),
        //     self.mint.to_account_info(),   // Corresponds to account_metas[2]
        //     self.token_program.to_account_info(),
        // ];

        // invoke(
        //     &ata_instruction,
        //     account_infos_for_invoke // Pass the slice of AccountInfos
        // )?;
        msg!("FIRST 66");




        // let cpi_accounts = ExtendAccount {
        //     user: self.signer, // Pass the account needed by instr two
        //     bonding_curve: self.bonding_curve, // Pass the authority needed by instr two
        //     system_program: self.system_program,
        // };

        //    We need the Program account info for the program being called (itself)
        // let cpi_program = Pubkey::from_str("DYXLtY7XsBrrBqjCUjEFm8kFc7Bc8LDd37ASbvNd9HaF");

        //    Create the CpiContext

        // let amount = (0.00144072 * LAMPORTS_PER_SOL) as u64;

        // self.program.extend_account(cpi_context, amount);

        // ExtendAccount::extend_account(&mut ExtendAccount {
        //         user: self.signer.clone(),
        //         bonding_curve: self.bonding_curve.to_account_info(),
        //         system_program: self.system_program.clone(),
        //         token_program: self.token_program.clone(),
        //     }, amount);


        // 






        // let mut instruction_data = Vec::with_capacity(8);
        // let check_token_mint_discriminator: [u8; 8] = [234, 102, 194, 203, 150, 72, 62, 229]; // EXAMPLE ONLY
        // instruction_data.write_all(&check_token_mint_discriminator)?;
        // // instruction_data.write_all(&amount.to_le_bytes())?;

        //  let account_metas = vec![
        //     // Assuming CheckTokenMintAccounts needs: external_token_mint, user, token_program
        //     // AccountMeta::new_readonly(*ctx.accounts.mint_to_check.key, false), // external_token_mint (read-only in check_token_mint)
        //     AccountMeta::new_readonly(self.signer.key(), true),   // user (signer)
        //     AccountMeta::new_readonly(self.bonding_curve.key(), false), // token_program (read-only)
        //     AccountMeta::new_readonly(self.token_program.key(), false), // token_program (read-only)
        //     AccountMeta::new_readonly(self.system_program.key(), false), // token_program (read-only)
        // ];

        // let instruction_to_call = Instruction {
        //     program_id: self.program.key(), // The actual Program ID of AccountInfoExample
        //     accounts: account_metas,
        //     data: instruction_data,
        // };

        // let account_infos_for_invoke = &[
        //     self.signer.to_account_info(),
        //     self.bonding_curve.to_account_info(),
        //     self.token_program.to_account_info(),   // Corresponds to account_metas[2]
        //     self.system_program.to_account_info(),   // Corresponds to account_metas[2]
        //     // self.program.clone(),  // The program being invoked
        // ];

        // invoke(
        //     &instruction_to_call,
        //     account_infos_for_invoke // Pass the slice of AccountInfos
        // )?;
        
        


        // crate::cpi::extend_account(cpi_context, (0.00144072 * LAMPORTS_PER_SOL) as u64)?;




        msg!("Instruction: Create Token With Curve");
        msg!("Signer: {}", self.signer.key());
        msg!("New Mint: {}", self.mint.key());

        // msg!("Greetings from: {:?}", self.program_id);
        Ok(())
    }
}