import { BaseMessageSignerWalletAdapter, WalletAdapterNetwork, WalletReadyState, WalletName } from '@solana/wallet-adapter-base';
import { PublicKey, Transaction, Connection, SendOptions, TransactionSignature, TransactionVersion, VersionedTransaction } from '@solana/web3.js';
import { Keypair } from '@solana/web3.js';
import { sign } from 'tweetnacl';

type TransactionOrVersionedTransaction = Transaction | VersionedTransaction;

export class LocalWalletAdapter extends BaseMessageSignerWalletAdapter {
    name = 'Local Wallet (dev)' as WalletName;
    url = 'https://github.com/solana-labs/wallet-adapter';
    icon = 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/main/packages/wallets/icons/solana.svg';
    supportedTransactionVersions: ReadonlySet<TransactionVersion> = new Set(['legacy', 0]);
    readyState = WalletReadyState.Installed;
    private _publicKey: PublicKey | null = null;
    private _keypair: Keypair | null = null;
    private _connecting = false;
    private _connected = false;
    private _connection: Connection | null = null;

    get publicKey() {
        return this._publicKey;
    }
    get connecting() {
        return this._connecting;
    }
    get connected() {
        return this._connected;
    }
    get ready() {
        return true;
    }

    async connect(): Promise<void> {
        if (this._connected || this._connecting) return;
        this._connecting = true;
        try {
            // Dynamically import the user keypair
            const keyArray: number[] = (await import('@/custom_keys/wallets/user.json')).default;
            const secret = Uint8Array.from(keyArray);
            this._keypair = Keypair.fromSecretKey(secret);
            this._publicKey = this._keypair.publicKey;
            // Use endpoint from localStorage or default
            const endpoint = localStorage.getItem('solana-network') || 'http://localhost:8899';
            this._connection = new Connection(endpoint, 'confirmed');
            this._connected = true;
            this.emit('connect', this._publicKey);
        } finally {
            this._connecting = false;
        }
    }

    async disconnect(): Promise<void> {
        this._connected = false;
        this._publicKey = null;
        this._keypair = null;
        this._connection = null;
        this.emit('disconnect');
    }

    async sendTransaction(transaction: Transaction, connection: Connection, options?: SendOptions): Promise<TransactionSignature> {
        if (!this._keypair) throw new Error('Wallet not connected');
        transaction.partialSign(this._keypair);
        return await connection.sendRawTransaction(transaction.serialize(), options);
    }

    async signTransaction<T extends TransactionOrVersionedTransaction>(transaction: T): Promise<T> {
        if (!this._keypair) throw new Error('Wallet not connected');
        if ('version' in transaction) {
            transaction.sign([this._keypair]);
        } else {
            transaction.partialSign(this._keypair);
        }
        return transaction;
    }

    async signAllTransactions<T extends TransactionOrVersionedTransaction[]>(transactions: T): Promise<T> {
        if (!this._keypair) throw new Error('Wallet not connected');
        for (const transaction of transactions) {
            if ('version' in transaction) {
                transaction.sign([this._keypair]);
            } else {
                transaction.partialSign(this._keypair);
            }
        }
        return transactions;
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        if (!this._keypair) throw new Error('Wallet not connected');
        return sign.detached(message, this._keypair.secretKey);
    }
} 