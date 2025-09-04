import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useState, useCallback } from 'react';
import {
    PublicKey,
    Transaction,
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
import { Buffer } from 'buffer';

const PROGRAM_ID = new PublicKey(commcoinIdl.address);

export const useCoinTrade = () => {
    const { publicKey, signTransaction } = useWallet();
    const { connection } = useConnection();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ txSignature?: string } | null>(null);

    // Buy tokens for an existing coin
    const buyCoin = useCallback(async ({ mint, amountSol, price }: { mint: string, amountSol: number, price: number }) => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            if (!publicKey || !signTransaction) throw new Error('Wallet not connected');
            const mintPubkey = new PublicKey(mint);

            // Derive PDAs
            const [bondingCurve] = PublicKey.findProgramAddressSync(
                [Buffer.from('commcoin_bonding_curve'), mintPubkey.toBuffer()],
                PROGRAM_ID
            );
            const bondingCurveTokenVault = await getAssociatedTokenAddress(mintPubkey, bondingCurve, true);
            const userAta = await getAssociatedTokenAddress(mintPubkey, publicKey);

            // Create ATA if needed
            const ataIx = createAssociatedTokenAccountIdempotentInstruction(publicKey, userAta, publicKey, mintPubkey);

            // Calculate token amount to buy
            const initial_token_cost_in_sol_per_token = price > 0 ? price : 2.92508282e-8;
            const amount_used_in_sol = amountSol;
            const lamports_per_sol = 1000000000;
            const amount_sol_used_for_tokens = amount_used_in_sol - amount_used_in_sol * 0.1;
            const token_to_give = amount_sol_used_for_tokens / initial_token_cost_in_sol_per_token;

            // Prepare buy instruction
            const buyData = Buffer.alloc(16); // 8 bytes for amount, 8 for maxSolCost
            buyData.writeBigUInt64LE(BigInt(Math.floor(token_to_give * 1e6)), 0);
            buyData.writeBigUInt64LE(BigInt(Math.floor(lamports_per_sol * amount_used_in_sol)), 8);
            const discriminator = Buffer.from(commcoinIdl.instructions.find((i: any) => i.name === 'buy')!.discriminator);
            const finalBuyData = Buffer.concat([discriminator, buyData]);

            const buyIx = new TransactionInstruction({
                programId: PROGRAM_ID,
                keys: [
                    { pubkey: publicKey, isSigner: true, isWritable: true },
                    { pubkey: mintPubkey, isSigner: false, isWritable: true },
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

            const tx = new Transaction().add(ataIx, buyIx);
            tx.feePayer = publicKey;
            const { blockhash } = await connection.getLatestBlockhash();
            tx.recentBlockhash = blockhash;

            const signed = await signTransaction(tx);
            const sig = await connection.sendRawTransaction(signed.serialize());
            await connection.confirmTransaction(sig, 'confirmed');

            setResult({ txSignature: sig });
            setLoading(false);
            return { txSignature: sig };
        } catch (e: any) {
            setError(e.message || 'Unknown error');
            setLoading(false);
            throw e;
        }
    }, [publicKey, signTransaction, connection]);

    // Sell tokens for an existing coin
    const sellCoin = useCallback(async ({ mint, amountTokens, price }: { mint: string, amountTokens: number, price: number }) => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            if (!publicKey || !signTransaction) throw new Error('Wallet not connected');
            const mintPubkey = new PublicKey(mint);

            // Derive PDAs
            const [bondingCurve] = PublicKey.findProgramAddressSync(
                [Buffer.from('commcoin_bonding_curve'), mintPubkey.toBuffer()],
                PROGRAM_ID
            );
            const bondingCurveTokenVault = await getAssociatedTokenAddress(mintPubkey, bondingCurve, true);
            const userAta = await getAssociatedTokenAddress(mintPubkey, publicKey);

            // Create ATA if needed
            const ataIx = createAssociatedTokenAccountIdempotentInstruction(publicKey, userAta, publicKey, mintPubkey);

            // Prepare sell instruction
            const lamports_per_sol = 1000000000;
            const initial_token_cost_in_sol_per_token = price > 0 ? price : 2.92508282e-8;
            const sol_to_receive = amountTokens * initial_token_cost_in_sol_per_token;
            const sellData = Buffer.alloc(16); // 8 bytes for amount, 8 for maxSolCost
            sellData.writeBigUInt64LE(BigInt(Math.floor(amountTokens * 1e6)), 0);
            sellData.writeBigUInt64LE(BigInt(Math.floor(lamports_per_sol * sol_to_receive)), 8);
            const discriminator = Buffer.from(commcoinIdl.instructions.find((i: any) => i.name === 'sell')!.discriminator);
            const finalSellData = Buffer.concat([discriminator, sellData]);

            const sellIx = new TransactionInstruction({
                programId: PROGRAM_ID,
                keys: [
                    { pubkey: publicKey, isSigner: true, isWritable: true },
                    { pubkey: mintPubkey, isSigner: false, isWritable: true },
                    { pubkey: bondingCurve, isSigner: false, isWritable: true },
                    { pubkey: bondingCurveTokenVault, isSigner: false, isWritable: true },
                    { pubkey: userAta, isSigner: false, isWritable: true },
                    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                    { pubkey: PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
                ],
                data: finalSellData,
            });

            const tx = new Transaction().add(ataIx, sellIx);
            tx.feePayer = publicKey;
            const { blockhash } = await connection.getLatestBlockhash();
            tx.recentBlockhash = blockhash;

            const signed = await signTransaction(tx);
            const sig = await connection.sendRawTransaction(signed.serialize());
            await connection.confirmTransaction(sig, 'confirmed');

            setResult({ txSignature: sig });
            setLoading(false);
            return { txSignature: sig };
        } catch (e: any) {
            setError(e.message || 'Unknown error');
            setLoading(false);
            throw e;
        }
    }, [publicKey, signTransaction, connection]);

    return { buyCoin, sellCoin, loading, error, result };
}; 