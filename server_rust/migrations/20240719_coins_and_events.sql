-- Coins table
CREATE TABLE IF NOT EXISTS coins (
    id SERIAL PRIMARY KEY,
    mint TEXT UNIQUE NOT NULL,
    symbol TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    creator TEXT NOT NULL,
    initial_supply BIGINT,
    tx_signature TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Buy/Sell events table
CREATE TABLE IF NOT EXISTS buy_sell_events (
    id SERIAL PRIMARY KEY,
    user_pubkey TEXT NOT NULL,
    mint TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('buy', 'sell')),
    amount BIGINT NOT NULL,
    sol_amount BIGINT,
    tx_signature TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- User holdings table
CREATE TABLE IF NOT EXISTS user_holdings (
    id SERIAL PRIMARY KEY,
    user_pubkey TEXT NOT NULL,
    mint TEXT NOT NULL,
    balance BIGINT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_pubkey, mint)
); 