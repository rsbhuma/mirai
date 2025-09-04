#!/usr/bin/env python3
"""
Helius API Setup and Test Script
This script helps you set up your Helius API key and test the connection.
"""

import os
import requests
import json
from typing import Optional

def get_helius_api_key() -> Optional[str]:
    """Get Helius API key from user input"""
    print("🔑 Helius API Setup")
    print("=" * 50)
    print("To use real Solana blockchain data, you need a Helius API key.")
    print("1. Go to https://www.helius.dev/")
    print("2. Sign up for a free account")
    print("3. Create a new API key")
    print("4. Copy your API key")
    print()
    
    api_key = input("Enter your Helius API key: ").strip()
    if not api_key:
        print("❌ No API key provided. Using fallback RPC URL.")
        return None
    
    return api_key

def test_helius_connection(api_key: str) -> bool:
    """Test the Helius API connection"""
    print("\n🧪 Testing Helius Connection...")
    
    url = f"https://mainnet.helius-rpc.com/v0/{api_key}"
    
    # Test payload for getting slot
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getSlot"
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        if "result" in result:
            print(f"✅ Connection successful! Current slot: {result['result']}")
            return True
        else:
            print(f"❌ API error: {result.get('error', 'Unknown error')}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection failed: {e}")
        return False

def update_env_file(api_key: str):
    """Update the .env file with the Helius API key"""
    env_file = ".env"
    
    # Read existing .env file
    env_lines = []
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            env_lines = f.readlines()
    
    # Update or add HELIUS_RPC_URL
    helius_line = f"HELIUS_RPC_URL=https://mainnet.helius-rpc.com/v0/{api_key}\n"
    
    # Find and replace existing HELIUS_RPC_URL line
    updated = False
    for i, line in enumerate(env_lines):
        if line.startswith("HELIUS_RPC_URL="):
            env_lines[i] = helius_line
            updated = True
            break
    
    # Add if not found
    if not updated:
        env_lines.append(helius_line)
    
    # Write back to file
    with open(env_file, 'w') as f:
        f.writelines(env_lines)
    
    print(f"✅ Updated {env_file} with your Helius API key")

def get_sample_transactions(api_key: str):
    """Get some sample transactions to verify the API works"""
    print("\n📊 Fetching Sample Transactions...")
    
    url = f"https://mainnet.helius-rpc.com/v0/{api_key}"
    
    # Get recent transactions
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getRecentPerformanceSamples",
        "params": [5]  # Get last 5 samples
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        if "result" in result:
            samples = result["result"]
            print(f"✅ Retrieved {len(samples)} performance samples")
            
            if samples:
                latest = samples[0]
                print(f"📈 Latest sample:")
                print(f"   - Slot: {latest.get('slot', 'N/A')}")
                print(f"   - Transactions: {latest.get('numTransactions', 'N/A')}")
                print(f"   - Time: {latest.get('samplePeriodSecs', 'N/A')} seconds")
            
            return True
        else:
            print(f"❌ API error: {result.get('error', 'Unknown error')}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to fetch sample data: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 Community Coin Server - Helius Setup")
    print("=" * 50)
    
    # Get API key
    api_key = get_helius_api_key()
    if not api_key:
        print("\n⚠️  No API key provided. The server will use fallback RPC URL.")
        print("   You can still run the server, but it will use mock data.")
        return
    
    # Test connection
    if test_helius_connection(api_key):
        # Update .env file
        update_env_file(api_key)
        
        # Get sample data
        get_sample_transactions(api_key)
        
        print("\n🎉 Setup complete!")
        print("You can now run the Rust server with real blockchain data:")
        print("   cd server_rust && cargo run")
        
    else:
        print("\n❌ Setup failed. Please check your API key and try again.")
        print("The server will use fallback RPC URL with mock data.")

if __name__ == "__main__":
    main() 