import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useState, useCallback } from 'react';
import {
    PublicKey,
    Keypair,
    Transaction,
    Connection,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    TransactionInstruction
} from '@solana/web3.js';
import {
    createAssociatedTokenAccountIdempotentInstruction,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import commcoinIdl from '@/idls/commcoin.json';


const PROGRAM_ID = new PublicKey(commcoinIdl.address);

/**
 * Derives a PDA address and fetches its account info from the network.
 * @param seeds The seeds used to derive the PDA.
 * @param programId The program ID that owns the PDA.
 * @param connection The Solana connection object.
 * @returns An object containing the PDA address and its account info (or null).
 */
async function fetchPdaAccount(seeds: (Buffer | Uint8Array)[], programId: PublicKey, connection: Connection) {
    const [pdaAddress] = PublicKey.findProgramAddressSync(seeds, programId);
    console.log("Derived PDA Address to fetch:", pdaAddress.toBase58());
    const accountInfo = await connection.getAccountInfo(pdaAddress);
    return { pdaAddress, accountInfo };
}

export interface IgniteCoinParams {
    amountSol: number;
    postId: string;
    title: string;
    description: string;
    symbol: string;
    iconUrl?: string;
}

export const useIgniteCoin = () => {
    const { publicKey, signTransaction } = useWallet();
    const { connection } = useConnection();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ mintAddress?: string; txSignature?: string } | null>(null);

    const igniteCoin = useCallback(async (params: IgniteCoinParams) => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            if (!publicKey || !signTransaction) throw new Error('Wallet not connected');

            const mintKeypair = Keypair.generate();
            const mint = mintKeypair.publicKey;

            // --- Derive all required PDAs ---
            const [mintAuthority] = PublicKey.findProgramAddressSync(
                [Buffer.from("commcoin_bonding_curve"), Buffer.from("commcoin_random_minted")],
                PROGRAM_ID
            );
            const [bondingCurve] = PublicKey.findProgramAddressSync(
                [Buffer.from("commcoin_bonding_curve"), mint.toBuffer()],
                PROGRAM_ID
            );
            const [vault] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault_config_v1"), mint.toBuffer()],
                PROGRAM_ID
            );
            const [vaultTokenAccount] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault_tokens_v1"), mint.toBuffer()],
                PROGRAM_ID
            );
            const bondingCurveTokenVault = await getAssociatedTokenAddress(mint, bondingCurve, true);
            const userAta = await getAssociatedTokenAddress(mint, publicKey);

            // --- Build Instructions ---

            const createCoinIx = new TransactionInstruction({
                programId: PROGRAM_ID,
                keys: [
                    { pubkey: publicKey, isSigner: true, isWritable: true }, // signer
                    { pubkey: mintAuthority, isSigner: false, isWritable: true },
                    { pubkey: mint, isSigner: true, isWritable: true },
                    { pubkey: vault, isSigner: false, isWritable: true },
                    { pubkey: vaultTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: bondingCurve, isSigner: false, isWritable: true },
                    { pubkey: bondingCurveTokenVault, isSigner: false, isWritable: true },
                    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
                ],
                data: Buffer.from(commcoinIdl.instructions.find((i: any) => i.name === 'create_coin')!.discriminator),
            });

            const extendAccountIx = new TransactionInstruction({
                programId: PROGRAM_ID,
                keys: [
                    { pubkey: publicKey, isSigner: true, isWritable: true }, // user
                    { pubkey: bondingCurve, isSigner: false, isWritable: true }, // curve_account
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                ],
                data: Buffer.from(commcoinIdl.instructions.find((i: any) => i.name === 'extend_account')!.discriminator),
            });

            const ataIx = createAssociatedTokenAccountIdempotentInstruction(publicKey, userAta, publicKey, mint);

            const initial_token_cost_in_sol_per_token = 2.92508282e-8;
            const amount_used_in_sol = params.amountSol;
            const lamports_per_sol = 1000000000;
            const amount_sol_used_for_tokens = amount_used_in_sol - amount_used_in_sol * 0.1;
            const token_to_give = amount_sol_used_for_tokens / initial_token_cost_in_sol_per_token;

            const buyData = Buffer.alloc(16); // 8 bytes for amount, 8 for maxSolCost
            buyData.writeBigUInt64LE(BigInt(Math.floor(token_to_give * 1e6)), 0);
            buyData.writeBigUInt64LE(BigInt(Math.floor(lamports_per_sol * amount_used_in_sol)), 8);
            const discriminator = Buffer.from(commcoinIdl.instructions.find((i: any) => i.name === 'buy')!.discriminator);
            const finalBuyData = Buffer.concat([discriminator, buyData]);

            const buyIx = new TransactionInstruction({
                programId: PROGRAM_ID,
                keys: [
                    { pubkey: publicKey, isSigner: true, isWritable: true },
                    { pubkey: mint, isSigner: false, isWritable: true },
                    { pubkey: bondingCurve, isSigner: false, isWritable: true },
                    { pubkey: bondingCurveTokenVault, isSigner: false, isWritable: true },
                    { pubkey: userAta, isSigner: false, isWritable: true },
                    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                    { pubkey: PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
                ],
                data: finalBuyData,
            });

            const tx = new Transaction().add(createCoinIx, extendAccountIx, ataIx, buyIx);
            tx.feePayer = publicKey;
            const { blockhash } = await connection.getLatestBlockhash();
            tx.recentBlockhash = blockhash;

            console.log("Transaction JSON:", JSON.stringify(tx, null, 2));

            tx.partialSign(mintKeypair);

            const signed = await signTransaction(tx);
            const sig = await connection.sendRawTransaction(signed.serialize());
            await connection.confirmTransaction(sig, 'confirmed');

            setResult({ mintAddress: mint.toBase58(), txSignature: sig });
            setLoading(false);
            return { mintAddress: mint.toBase58(), txSignature: sig };
        } catch (e: any) {
            console.error("Ignite Coin Error:", e);
            setError(e.message || 'Unknown error');
            setLoading(false);
            throw e;
        }
    }, [publicKey, signTransaction, connection]);

    return { igniteCoin, loading, error, result };
}; 