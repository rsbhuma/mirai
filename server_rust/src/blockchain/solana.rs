use reqwest::Client;
use serde_json::Value;
use crate::config::Config;
use crate::error::{AppError, AppResult};

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct SolanaClient {
    rpc_url: String,
    ws_url: String,
    http_client: Client,
    program_id: String,
}

#[allow(dead_code)]
impl SolanaClient {
    pub fn new(config: &Config) -> Self {
        Self {
            rpc_url: config.solana_rpc_url.clone(),
            ws_url: config.solana_ws_url.clone(),
            http_client: Client::new(),
            program_id: config.commcoin_program_id.clone(),
        }
    }

    pub async fn health_check(&self) -> AppResult<()> {
        let payload = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getHealth"
        });

        let response = self.http_client
            .post(&self.rpc_url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| AppError::Internal(format!("Solana RPC request failed: {}", e)))?;

        if response.status().is_success() {
            Ok(())
        } else {
            Err(AppError::Internal(format!("Solana health check failed with status: {}", response.status())))
        }
    }

    pub async fn get_balance(&self, pubkey: &str) -> AppResult<u64> {
        let payload = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getBalance",
            "params": [pubkey]
        });

        let response = self.http_client
            .post(&self.rpc_url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| AppError::Internal(format!("Solana RPC request failed: {}", e)))?;

        let json: Value = response.json().await
            .map_err(|e| AppError::Internal(format!("Failed to parse Solana response: {}", e)))?;

        if let Some(result) = json.get("result") {
            if let Some(value) = result.get("value") {
                return Ok(value.as_u64().unwrap_or(0));
            }
        }

        Err(AppError::Internal("Invalid response format from Solana RPC".to_string()))
    }

    pub async fn get_transaction(&self, signature: &str) -> AppResult<Option<Value>> {
        let payload = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTransaction",
            "params": [signature, {"encoding": "json"}]
        });

        let response = self.http_client
            .post(&self.rpc_url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| AppError::Internal(format!("Solana RPC request failed: {}", e)))?;

        let json: Value = response.json().await
            .map_err(|e| AppError::Internal(format!("Failed to parse Solana response: {}", e)))?;

        if let Some(result) = json.get("result") {
            if result.is_null() {
                Ok(None)
            } else {
                Ok(Some(result.clone()))
            }
        } else {
            Err(AppError::Internal("Invalid response format from Solana RPC".to_string()))
        }
    }

    pub async fn verify_transaction(&self, signature: &str) -> AppResult<bool> {
        match self.get_transaction(signature).await? {
            Some(tx) => {
                // Check if transaction was successful
                if let Some(meta) = tx.get("meta") {
                    if let Some(err) = meta.get("err") {
                        Ok(err.is_null())
                    } else {
                        Ok(true)
                    }
                } else {
                    Ok(false)
                }
            }
            None => Ok(false),
        }
    }

    pub async fn get_token_accounts(&self, owner: &str, mint: &str) -> AppResult<Vec<Value>> {
        let payload = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTokenAccountsByOwner",
            "params": [
                owner,
                {"mint": mint},
                {"encoding": "jsonParsed"}
            ]
        });

        let response = self.http_client
            .post(&self.rpc_url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| AppError::Internal(format!("Solana RPC request failed: {}", e)))?;

        let json: Value = response.json().await
            .map_err(|e| AppError::Internal(format!("Failed to parse Solana response: {}", e)))?;

        if let Some(result) = json.get("result") {
            if let Some(value) = result.get("value") {
                if let Some(accounts) = value.as_array() {
                    return Ok(accounts.clone());
                }
            }
        }

        Ok(vec![])
    }

    pub async fn get_token_supply(&self, mint: &str) -> AppResult<u64> {
        let payload = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTokenSupply",
            "params": [mint]
        });

        let response = self.http_client
            .post(&self.rpc_url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| AppError::Internal(format!("Solana RPC request failed: {}", e)))?;

        let json: Value = response.json().await
            .map_err(|e| AppError::Internal(format!("Failed to parse Solana response: {}", e)))?;

        if let Some(result) = json.get("result") {
            if let Some(value) = result.get("value") {
                if let Some(amount) = value.get("amount") {
                    if let Some(amount_str) = amount.as_str() {
                        return Ok(amount_str.parse().unwrap_or(0));
                    }
                }
            }
        }

        Ok(0)
    }

    pub async fn get_program_accounts(&self) -> AppResult<Vec<Value>> {
        let payload = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getProgramAccounts",
            "params": [
                self.program_id,
                {
                    "encoding": "jsonParsed",
                    "filters": []
                }
            ]
        });

        let response = self.http_client
            .post(&self.rpc_url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| AppError::Internal(format!("Solana RPC request failed: {}", e)))?;

        let json: Value = response.json().await
            .map_err(|e| AppError::Internal(format!("Failed to parse Solana response: {}", e)))?;

        if let Some(result) = json.get("result") {
            if let Some(accounts) = result.as_array() {
                return Ok(accounts.clone());
            }
        }

        Ok(vec![])
    }

    pub async fn simulate_transaction(&self, transaction: &str) -> AppResult<Value> {
        let payload = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "simulateTransaction",
            "params": [transaction]
        });

        let response = self.http_client
            .post(&self.rpc_url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| AppError::Internal(format!("Solana RPC request failed: {}", e)))?;

        let json: Value = response.json().await
            .map_err(|e| AppError::Internal(format!("Failed to parse Solana response: {}", e)))?;

        if let Some(result) = json.get("result") {
            Ok(result.clone())
        } else {
            Err(AppError::Internal("Invalid response format from Solana RPC".to_string()))
        }
    }

    pub async fn get_recent_blockhash(&self) -> AppResult<String> {
        let payload = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getRecentBlockhash"
        });

        let response = self.http_client
            .post(&self.rpc_url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| AppError::Internal(format!("Solana RPC request failed: {}", e)))?;

        let json: Value = response.json().await
            .map_err(|e| AppError::Internal(format!("Failed to parse Solana response: {}", e)))?;

        if let Some(result) = json.get("result") {
            if let Some(value) = result.get("value") {
                if let Some(blockhash) = value.get("blockhash") {
                    if let Some(hash_str) = blockhash.as_str() {
                        return Ok(hash_str.to_string());
                    }
                }
            }
        }

        Err(AppError::Internal("Invalid response format from Solana RPC".to_string()))
    }

    pub fn get_rpc_url(&self) -> &str {
        &self.rpc_url
    }

    pub fn get_ws_url(&self) -> &str {
        &self.ws_url
    }

    pub fn get_program_id(&self) -> &str {
        &self.program_id
    }

    #[cfg(test)]
    pub fn new_mock() -> Self {
        Self {
            rpc_url: "http://localhost:8899".to_string(),
            ws_url: "ws://localhost:8900".to_string(),
            http_client: Client::new(),
            program_id: "test_program_id".to_string(),
        }
    }
} 