use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "transaction_type", rename_all = "lowercase")]
pub enum TransactionType {
    Buy,
    Sell,
    Create,
    Transfer,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "transaction_status", rename_all = "lowercase")]
pub enum TransactionStatus {
    Pending,
    Confirmed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Transaction {
    pub id: Uuid,
    pub tx_signature: String,
    pub user_id: Uuid,
    pub token_id: Uuid,
    pub transaction_type: TransactionType,
    pub status: TransactionStatus,
    pub sol_amount: Option<Decimal>,
    pub token_amount: Option<Decimal>,
    pub price_per_token: Option<Decimal>,
    pub total_value: Decimal,
    pub gas_fee: Decimal,
    pub slippage: Option<Decimal>,
    pub block_hash: Option<String>,
    pub block_number: Option<i64>,
    pub confirmations: i32,
    pub failure_reason: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTransactionRequest {
    pub token_id: Uuid,
    pub transaction_type: TransactionType,
    pub sol_amount: Option<Decimal>,
    pub token_amount: Option<Decimal>,
    pub slippage: Option<Decimal>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TransactionResponse {
    pub id: Uuid,
    pub tx_signature: String,
    pub user_id: Uuid,
    pub token_id: Uuid,
    pub transaction_type: TransactionType,
    pub status: TransactionStatus,
    pub sol_amount: Option<Decimal>,
    pub token_amount: Option<Decimal>,
    pub price_per_token: Option<Decimal>,
    pub total_value: Decimal,
    pub gas_fee: Decimal,
    pub slippage: Option<Decimal>,
    pub confirmations: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TransactionHistory {
    pub transactions: Vec<TransactionResponse>,
    pub total_count: i64,
    pub page: i32,
    pub per_page: i32,
    pub total_pages: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserTransactionStats {
    pub user_id: Uuid,
    pub total_transactions: i64,
    pub total_volume: Decimal,
    pub total_fees_paid: Decimal,
    pub successful_transactions: i64,
    pub failed_transactions: i64,
    pub average_transaction_size: Decimal,
}

impl From<Transaction> for TransactionResponse {
    fn from(transaction: Transaction) -> Self {
        Self {
            id: transaction.id,
            tx_signature: transaction.tx_signature,
            user_id: transaction.user_id,
            token_id: transaction.token_id,
            transaction_type: transaction.transaction_type,
            status: transaction.status,
            sol_amount: transaction.sol_amount,
            token_amount: transaction.token_amount,
            price_per_token: transaction.price_per_token,
            total_value: transaction.total_value,
            gas_fee: transaction.gas_fee,
            slippage: transaction.slippage,
            confirmations: transaction.confirmations,
            created_at: transaction.created_at,
        }
    }
} 