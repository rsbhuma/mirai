use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct BondingCurveState {
    pub virtual_sol_reserves: u64,
    pub virtual_token_reserves: u64,
    pub real_sol_reserves: u64,
    pub real_token_reserves: u64,
    pub token_total_supply: u64,
    pub bump: u8,
    // Add curve parameters (e.g., curve type identifier, constants)
    // Add other fields as necessary (e.g., is_active flag)
}

impl BondingCurveState {
    // Calculate space needed for the account
    // 8 (discriminator) + 32 (mint) + 32 (creator) + 8*4 (reserves) + 1 (bump) + padding/future fields
    pub const LEN: usize = 8 + (8 * 5) + 1; // Add padding for future use
}