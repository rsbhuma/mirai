import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useState, useCallback } from 'react';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import commcoinIdl from '@/idls/commcoin.json';

const PROGRAM_ID = new PublicKey(commcoinIdl.address);

// Helper to encode instruction data (discriminator + args)
function encodeInstruction(idl: any, method: string, args: any[]): Buffer {
    const ix = idl.instructions.find((i: any) => i.name === method);
    if (!ix) throw new Error(`Method ${method} not found in IDL`);
    const discriminator = Buffer.from(ix.discriminator);
    const argBuffers = args.map(arg => Buffer.isBuffer(arg) ? arg : Buffer.from(arg));
    return Buffer.concat([discriminator, ...argBuffers]);
}

export const useProgramMethod = () => {
    const { publicKey, signTransaction } = useWallet();
    const { connection } = useConnection();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Call a method by name, with args and accounts
    const callMethod = useCallback(
        async (
            method: string,
            args: any[],
            accounts: { [name: string]: PublicKey },
            programId: PublicKey = PROGRAM_ID
        ) => {
            setLoading(true);
            setError(null);
            try {
                if (!publicKey || !signTransaction) throw new Error('Wallet not connected');
                // Find method in IDL
                const ix = commcoinIdl.instructions.find((i: any) => i.name === method);
                if (!ix) throw new Error(`Method ${method} not found in IDL`);
                // Build account metas
                const keys = ix.accounts.map((acc: any) => {
                    const pubkey = accounts[acc.name];
                    if (!pubkey) throw new Error(`Missing account: ${acc.name}`);
                    return {
                        pubkey,
                        isWritable: !!acc.writable,
                        isSigner: !!acc.signer,
                    };
                });
                // Encode data
                const data = encodeInstruction(commcoinIdl, method, args);
                // Build instruction
                const instruction = new TransactionInstruction({
                    programId,
                    keys,
                    data,
                });
                // Build transaction
                const tx = new Transaction().add(instruction);
                tx.feePayer = publicKey;
                const { blockhash } = await connection.getLatestBlockhash();
                tx.recentBlockhash = blockhash;
                // Sign
                const signed = await signTransaction(tx);
                // Send
                const sig = await connection.sendRawTransaction(signed.serialize());
                await connection.confirmTransaction(sig, 'confirmed');
                setLoading(false);
                return sig;
            } catch (e: any) {
                setError(e.message || 'Unknown error');
                setLoading(false);
                throw e;
            }
        },
        [publicKey, signTransaction, connection]
    );

    return { callMethod, loading, error };
}; 