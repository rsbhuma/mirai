import fs from "fs";
import os from "os";

import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from '@solana/web3.js';
import { assert } from "chai";
import { Commcoin } from "../target/types/commcoin";

import {
  createMint,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  // For creating a transfer instruction if anotherInstruction needs it
  createTransferInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
  getAccount,
} from "@solana/spl-token";

function loadKeypair(keypairPath: string): Keypair {
  // Expand the tilde (~) to the home directory if present
  if (keypairPath.startsWith("~")) {
    keypairPath = os.homedir() + keypairPath.slice(1);
  }
  // Load the keypair file
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  // Create and return the Keypair object
  return Keypair.fromSecretKey(new Uint8Array(keypairData));
}


describe('Create Tokens', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  // Specify the path to your custom keypair file
  const userWallletPath = "/code/meme_world/community_coin/contracts/test/data/wallets/user.json"; // <--- CHANGE THIS PATH
  const userKeyPair = loadKeypair(userWallletPath);

  const adminWallletPath = "/code/meme_world/community_coin/contracts/test/data/solana_config/id.json"; // <--- CHANGE THIS PATH
  const adminKeyPair = loadKeypair(adminWallletPath);


  const program = anchor.workspace.Commcoin as anchor.Program<Commcoin>;

  const metadata = {
    name: 'Solana Gold',
    symbol: 'GOLDSOL',
    uri: 'https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/spl-token.json',
  };

  it('Create an SPL Token!', async () => {
    // Generate new keypair to use as address for mint account.
    const mintKeypair = new Keypair();
    const bondingCurveKeyPair = new Keypair();

    try {
      // SPL Token default = 9 decimals
      const create_coin_tx = await program.methods
        .createCoin()
        .accounts({
          signer: userKeyPair.publicKey,
          mint: mintKeypair.publicKey,
        })
        .instruction();

      const [curveAddress, _bumpCurveAddress] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("commcoin_bonding_curve"),
          mintKeypair.publicKey.toBytes()
        ],
        program.programId
      )

      console.log("CURVE ", curveAddress,);



      const extend_account_tx = await program.methods
        .extendAccount()
        .accounts({
          user: userKeyPair.publicKey,
          curveAccount: curveAddress,
        })
        .instruction();
      // .signers([userKeyPair, mintKeypair])
      // .rpc();

      const ataForUser = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        userKeyPair.publicKey,
      )

      console.log("ATA ", ataForUser);

      const ataAccountInstruction = await createAssociatedTokenAccountIdempotentInstruction(
        userKeyPair.publicKey,
        ataForUser,
        userKeyPair.publicKey,
        mintKeypair.publicKey
      )

      const initial_token_cost_in_sol_per_token = 2.92508282e-8;//sol/token
      const amount_used_in_sol = 2;
      const lamports_per_sol = 1000000000;
      const amount_sol_used_for_tokens = amount_used_in_sol - amount_used_in_sol * 0.1;
      const token_to_give = (amount_sol_used_for_tokens) / (initial_token_cost_in_sol_per_token)

      const buy_tx = await program.methods
        .buy(
          new anchor.BN(token_to_give * 1e6),
          new anchor.BN(lamports_per_sol * amount_used_in_sol)
        )
        .accounts({
          user: userKeyPair.publicKey,
          mint: mintKeypair.publicKey,
        })
        .instruction();

      const transactions = new anchor.web3.Transaction()
        .add(create_coin_tx)
        .add(extend_account_tx)
        .add(ataAccountInstruction)
        .add(buy_tx);

      const txSignature = await provider.sendAndConfirm(transactions, [userKeyPair, mintKeypair /*, otherSignerKeypairs... */]);

      console.log('Success!');
      console.log(`   Mint Address: ${mintKeypair.publicKey}`);
      console.log(`   Transaction Signature: ${txSignature}`);
    } catch (error) {
      // --- Error Handling and Log Extraction ---
      console.error("Error sending/confirming transaction:");

      // Check if the error object looks like a standard Anchor/web3.js error
      // and has the 'logs' property which is an array.
      if (error && typeof error === 'object' && 'logs' in error && Array.isArray(error.logs)) {
        console.error("--- Transaction Logs ---");
        // Iterate over the logs array and print each log line
        (error.logs as string[]).forEach((log: string) => { // Cast logs to string[]
          // You can add filtering here if needed (e.g., only show program logs)
          // if (log.startsWith("Program log:") || log.includes(program.programId.toBase58())) {
          console.error(log);
          // }
        });
        console.error("--- End Logs ---");
      } else {
        // If logs aren't available in the expected format, print the basic error
        console.error("Raw error object:", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
        } else {
          console.error("Caught error is not an instance of Error.");
        }
        console.error("Could not extract detailed logs from the error object.");
      }
      // --- End Error Handling ---

      // Fail the test explicitly when an error occurs
      assert.fail(`Transaction failed: ${error}`);
    }


  });

  // it('Sell an SPL Token!', async () => {
  //   // Generate new keypair to use as address for mint account.
  //   // const mintKeypair = new Keypair();
  //   // const bondingCurveKeyPair = new Keypair();

  //   try {
  //     // SPL Token default = 9 decimals
  //     const initial_token_cost_in_sol_per_token = 2.92508282e-8;//sol/token
  //     const lamports_per_sol = 1000000000;

  //     const token_to_give = 38463280.844814;
  //     const amount_sol_used_for_tokens = token_to_give * initial_token_cost_in_sol_per_token;
  //     const sell_coin_tx = await program.methods
  //       .sell(
  //         new anchor.BN(token_to_give * 1e6),
  //         new anchor.BN(lamports_per_sol * amount_sol_used_for_tokens)
  //       )
  //       .accounts({
  //         user: userKeyPair.publicKey,
  //         mint: new PublicKey("cCF2zFZZ3XUPEhywX2WoK3VgnZFNPy2mQ2i3mPqvHxD")
  //       })
  //       .instruction();

  //     const transactions = new anchor.web3.Transaction()
  //       .add(sell_coin_tx);

  //     const txSignature = await provider.sendAndConfirm(transactions, [userKeyPair, /*, otherSignerKeypairs... */]);

  //     console.log('Success!');
  //     // console.log(`   Mint Address: ${mintKeypair.publicKey}`);
  //     console.log(`   Transaction Signature: ${txSignature}`);
  //   } catch (error) {
  //     // --- Error Handling and Log Extraction ---
  //     console.error("Error sending/confirming transaction:");

  //     // Check if the error object looks like a standard Anchor/web3.js error
  //     // and has the 'logs' property which is an array.
  //     if (error && typeof error === 'object' && 'logs' in error && Array.isArray(error.logs)) {
  //       console.error("--- Transaction Logs ---");
  //       // Iterate over the logs array and print each log line
  //       (error.logs as string[]).forEach((log: string) => { // Cast logs to string[]
  //         // You can add filtering here if needed (e.g., only show program logs)
  //         // if (log.startsWith("Program log:") || log.includes(program.programId.toBase58())) {
  //         console.error(log);
  //         // }
  //       });
  //       console.error("--- End Logs ---");
  //     } else {
  //       // If logs aren't available in the expected format, print the basic error
  //       console.error("Raw error object:", error);
  //       if (error instanceof Error) {
  //         console.error("Error message:", error.message);
  //       } else {
  //         console.error("Caught error is not an instance of Error.");
  //       }
  //       console.error("Could not extract detailed logs from the error object.");
  //     }
  //     // --- End Error Handling ---

  //     // Fail the test explicitly when an error occurs
  //     assert.fail(`Transaction failed: ${error}`);
  //   }


  // });

  // it('Extend account!', async () => {
  //     // Generate new keypair to use as address for mint account.
  //     // const mintKeypair = new Keypair();
  //     // const bondingCurveKeyPair = new Keypair();

  //     const transferAmount = new anchor.BN(0.00144072 * anchor.web3.LAMPORTS_PER_SOL);

  //     // SPL Token default = 9 decimals
  //     const transactionSignature = await program.methods
  //         .extendAccount(transferAmount)
  //         .accounts({
  //             user: userKeyPair.publicKey,
  //             bondingCurve: "HQE7NU56rBqF9JpbdDqFyLiv5K2Pu9Y1BeURGouJ8xjA",
  //         })
  //         .signers([userKeyPair])
  //         .rpc();

  //     console.log('Success!');
  //     console.log(`   Transaction Signature: ${transactionSignature}`);
  // });

  // it('Create an PDA!', async () => {
  //   // Generate new keypair to use as address for mint account.

  //   const newConfig = {};


  //   // SPL Token default = 9 decimals
  //   const transactionSignature = await program.methods
  //     .configure(newConfig)
  //     .accounts({
  //       admin: adminKeyPair.publicKey,
  //     })
  //     .signers([adminKeyPair])
  //     .rpc();

  //   console.log('Success!');
  //   console.log(`   admin Address: ${adminKeyPair.publicKey}`);
  //   console.log(`   Transaction Signature: ${transactionSignature}`);
  // });
});
