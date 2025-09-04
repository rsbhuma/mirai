use anchor_lang::{prelude::*, system_program};

use crate::{states::Config};

#[derive(Accounts)]
pub struct Configure<'info> {
    #[account(mut)]
    admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        seeds = [b"commcoin_bonding_curve", b"commcoin_random_minted"],//[Config::SEED_PREFIX.as_bytes()],
        space = 8 + Config::LEN,
        bump,
    )]
    mint_authority: Account<'info, Config>,

    #[account(address = system_program::ID)]
    system_program: Program<'info, System>,
}

impl<'info> Configure<'info> {
    pub fn process(&mut self, new_config: Config) -> Result<()> {
        // require!(self.mint_authority.authority.eq(&Pubkey::default())
        //     || self.mint_authority.authority.eq(&self.admin.key()), PumpError::NotAuthorized);

        self.mint_authority.set_inner(new_config);

        Ok(())
    }
}