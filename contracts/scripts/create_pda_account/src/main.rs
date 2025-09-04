use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    instruction::{AccountMeta, Instruction},
    message::Message, // Use Message V0 if needed, here using legacy
    pubkey::Pubkey,
    signature::{read_keypair_file, Keypair, Signer}, // Use read_keypair_file
    system_program,
    system_instruction,
    transaction::Transaction,
};
use std::{env, error::Error, path::PathBuf, str::FromStr, time::Duration};

// --- Configuration ---
// Your Program ID
const PROGRAM_ID_STR: &str = "DYXLtY7XsBrrBqjCUjEFm8kFc7Bc8LDd37ASbvNd9HaF";
// The seed used in your program to derive the PDA
// IMPORTANT: Replace with the actual seed bytes your program uses!
const PDA_SEED_BYTES: &[u8] = b"bonding_curve"; // Example seed
// The space the PDA account *would* require if created by the program
// IMPORTANT: Replace with the actual space your program requires for rent calculation!
const PDA_SPACE: usize = 0; // Example space (as usize for get_minimum_balance...)
// The space required for the PDA account's data
// IMPORTANT: Replace with the actual space your program requires!
// const PDA_SPACE: u64 = 100; // Example space - Note: This is needed by the *program*, not this client script
// Path to your Solana keypair file (using SOLANA_CLI_CONFIG_FILE env var or default)
fn get_keypair_path() -> PathBuf {
    match env::var("SOLANA_CLI_CONFIG_FILE") {
        Ok(path) => PathBuf::from(path),
        Err(_) => {
            // Default path if environment variable is not set
            let home = env::var("HOME").expect("Home directory not found");
            PathBuf::from(home).join(".config").join("solana").join("id.json")
        }
    }
}


// Solana cluster to connect to (using Devnet)
const CLUSTER_URL: &str = "http://localhost:8899";
// --- End Configuration ---

fn main() -> Result<(), Box<dyn Error>> {
    // --- 1. Setup Connection and Funder Keypair ---
    let rpc_url = String::from(CLUSTER_URL);
    let connection = RpcClient::new_with_commitment(rpc_url, CommitmentConfig::confirmed());

    let keypair_path = get_keypair_path();
    let funder_keypair = read_keypair_file(&keypair_path).map_err(|e| {
        format!(
            "Failed to read keypair from {}: {}",
            keypair_path.display(),
            e
        )
    })?;
    println!(
        "Using Funder/Signer: {}",
        funder_keypair.pubkey().to_string()
    );

    // Optional: Airdrop SOL if on devnet/testnet and needed
    let balance = connection.get_balance(&funder_keypair.pubkey())?;
    println!("Funder balance: {} SOL", balance as f64 / 1_000_000_000.0);
    if balance < 100_000_000 { // Check if balance is less than 0.1 SOL
        println!("Airdropping 1 SOL to funder...");
        match connection.request_airdrop(&funder_keypair.pubkey(), 1_000_000_000) {
            Ok(sig) => {
                loop {
                    let confirmed = connection.confirm_transaction_with_commitment(
                        &sig,
                        CommitmentConfig::confirmed(),
                    )?;
                    if confirmed.value {
                        println!("Airdrop confirmed.");
                        break;
                    }
                    println!("Waiting for airdrop confirmation...");
                    std::thread::sleep(Duration::from_secs(1));
                }
            }
            Err(e) => {
                 println!("Airdrop failed: {}. Please fund manually.", e);
                 // Consider returning an error if funding is critical
                 // return Err(Box::new(e));
            }
        }
    }


    // --- 2. Derive PDA Address ---
    let program_id = Pubkey::from_str(PROGRAM_ID_STR)?;
    let (pda_address, _bump_seed) =
        Pubkey::find_program_address(&[PDA_SEED_BYTES, b"random_minted"], &program_id); // Use the same seed(s)
    println!("Derived PDA Address: {}", pda_address.to_string());
    // Bump seed is usually only needed inside the program for invoke_signed

    let required_lamports = connection.get_minimum_balance_for_rent_exemption(PDA_SPACE)?;
    println!(
        "Minimum lamports required for rent exemption ({} bytes): {}",
        PDA_SPACE, required_lamports
    );

    // Check if funder has enough SOL for the transfer + fees
    let current_balance = connection.get_balance(&funder_keypair.pubkey())?;
    // Add a small buffer for transaction fees
    let estimated_fee = connection.get_fee_for_message(&Message::new_with_blockhash(
        &[system_instruction::transfer(
            &funder_keypair.pubkey(),
            &pda_address,
            required_lamports,
        )],
        Some(&funder_keypair.pubkey()),
        &connection.get_latest_blockhash()?, // Need a recent blockhash for fee calc
    ))?;
    if current_balance < required_lamports + estimated_fee {
         println!("Funder balance ({}) is less than required lamports ({}) + estimated fee ({}). Please fund the account.", current_balance, required_lamports, estimated_fee);
         return Err("Insufficient balance".into());
    }

    // // --- 3. Create the Instruction ---
    // // Define the accounts required by the Rust instruction
    // let accounts = vec![
    //     // 0. `[signer]` The account funding the PDA creation (payer).
    //     AccountMeta::new(funder_keypair.pubkey(), true), // is_signer = true, is_writable = true
    //     // 1. `[writable]` The PDA account to be created.
    //     AccountMeta::new(pda_address, false), // is_signer = false, is_writable = true
    //     // 2. `[]` The System Program account.
    //     AccountMeta::new_readonly(system_program::id(), false), // is_signer = false, is_writable = false
    // ];

    // // Create the instruction data buffer.
    // // As in the TS example, assuming no extra data is needed beyond accounts.
    // // Adjust if your program expects serialized data (e.g., instruction discriminator).
    // let instruction_data: Vec<u8> = Vec::new(); // Empty data, adjust if needed

    // let instruction = Instruction {
    //     program_id,
    //     accounts,
    //     data: instruction_data,
    // };

    // --- 4. Create System Transfer Instruction ---
    let transfer_instruction = system_instruction::transfer(
        &funder_keypair.pubkey(), // From: The funder signs and pays
        &pda_address,             // To: The calculated PDA address
        required_lamports,        // Amount: Exactly the rent-exempt minimum
    );


    // --- 4. Create and Send Transaction ---
    let recent_blockhash = connection.get_latest_blockhash()?;
    let message = Message::new(&[transfer_instruction], Some(&funder_keypair.pubkey()));
    let transaction = Transaction::new(&[&funder_keypair], message, recent_blockhash);


    println!(
        "Sending {} lamports to address {}...",
        required_lamports,
        pda_address.to_string()
    );
    match connection.send_and_confirm_transaction_with_spinner(&transaction) {
        Ok(signature) => {
            println!(
                "Transaction confirmed successfully! Signature: {}",
                signature
            );
            println!(
                "Explorer URL: https://explorer.solana.com/tx/{}?cluster=devnet",
                signature
            );

             // You can check the PDA account info now
             match connection.get_account(&pda_address) {
                 Ok(pda_info) => {
                     println!(
                         "PDA Account Info: Owner={}, Lamports={}, Space={}",
                         pda_info.owner.to_string(),
                         pda_info.lamports,
                         pda_info.data.len()
                     );
                     if pda_info.lamports < required_lamports {
                         println!("Warning: Target account balance is less than expected minimum rent.");
                    }
                 },
                 Err(_) => {
                     println!("PDA Account not found after confirmation (check explorer).");
                 }
             }

        }
        Err(e) => {
            eprintln!("Error sending transaction: {}", e);
            // You might want to inspect the error further, e.g., transaction logs if available in the error type
            return Err(Box::new(e));
        }
    }

    Ok(())
}
