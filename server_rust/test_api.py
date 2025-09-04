#!/usr/bin/env python3
"""
Test script for the Community Coin Server backend API
"""

import requests
import json
import time
import websockets
import asyncio
from typing import Dict, Any

BASE_URL = "http://localhost:9000"

def test_health_endpoint():
    """Test the health check endpoint"""
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_get_tokens():
    """Test getting all tokens"""
    print("\nTesting get tokens endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/tokens")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Get tokens successful: {len(data.get('tokens', []))} tokens found")
            for token in data.get('tokens', [])[:2]:  # Show first 2 tokens
                print(f"  - {token.get('name', 'Unknown')} ({token.get('category', 'Unknown')})")
            return True
        else:
            print(f"❌ Get tokens failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Get tokens error: {e}")
        return False

def test_create_token():
    """Test creating a new token"""
    print("\nTesting create token endpoint...")
    try:
        token_data = {
            "name": "Test Token",
            "description": "A test token for API testing",
            "full_description": "This is a comprehensive test token created via the API",
            "category": "Wild",
            "tier": "Tier1",
            "initial_amount": 100.0,
            "social_links": [
                {"link_type": "twitter", "url": "https://twitter.com/testtoken"},
                {"link_type": "website", "url": "https://testtoken.com"}
            ],
            "image_url": None,
            "bonding_curve_config": {
                "initial_price": 0.1,
                "slope": 0.001,
                "liquidity_threshold": 50000.0,
                "deadline": "2024-12-31T23:59:59Z",
                "escrow_address": "escrow_test_123"
            },
            "vesting_config": None
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tokens",
            json=token_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Create token successful: {data.get('token', {}).get('name', 'Unknown')}")
            print(f"  Transaction hash: {data.get('transaction_hash', 'Unknown')}")
            return data.get('token', {}).get('pub_address')
        else:
            print(f"❌ Create token failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Create token error: {e}")
        return None

def test_get_token_by_address(pub_address: str):
    """Test getting a specific token by address"""
    print(f"\nTesting get token by address: {pub_address}")
    try:
        response = requests.get(f"{BASE_URL}/api/tokens/{pub_address}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Get token by address successful: {data.get('name', 'Unknown')}")
            print(f"  Market cap: ${data.get('market_cap', 0):,.2f}")
            print(f"  Involvement: {data.get('involvement', 0)}")
            return True
        else:
            print(f"❌ Get token by address failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Get token by address error: {e}")
        return False

def test_add_discussion(token_id: str):
    """Test adding a discussion to a token"""
    print(f"\nTesting add discussion to token: {token_id}")
    try:
        discussion_data = {
            "id": "disc_1",
            "title": "Test Discussion",
            "author": "TestUser",
            "content": "This is a test discussion created via the API",
            "comments": 0,
            "latest_comment": None,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tokens/{token_id}/discussions",
            json=discussion_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print("✅ Add discussion successful")
            return True
        else:
            print(f"❌ Add discussion failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Add discussion error: {e}")
        return False

def test_stake_tokens(token_id: str):
    """Test staking tokens"""
    print(f"\nTesting stake tokens for token: {token_id}")
    try:
        wallet_address = "test_wallet_123"
        stake_amount = 50.0
        
        response = requests.post(
            f"{BASE_URL}/api/tokens/{token_id}/stake/{wallet_address}",
            json=stake_amount,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print(f"✅ Stake tokens successful: {stake_amount} tokens staked")
            return True
        else:
            print(f"❌ Stake tokens failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Stake tokens error: {e}")
        return False

def test_get_reward_pool(token_id: str):
    """Test getting reward pool for a token"""
    print(f"\nTesting get reward pool for token: {token_id}")
    try:
        response = requests.get(f"{BASE_URL}/api/tokens/{token_id}/reward-pool")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Get reward pool successful")
            print(f"  Total staked: {data.get('total_staked', 0)}")
            print(f"  Contributors: {len(data.get('contributors', []))}")
            return True
        elif response.status_code == 404:
            print("ℹ️  No reward pool found (expected for Tier1 tokens)")
            return True
        else:
            print(f"❌ Get reward pool failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Get reward pool error: {e}")
        return False

async def test_websocket():
    """Test WebSocket connection and messaging"""
    print("\nTesting WebSocket connection...")
    try:
        uri = "ws://localhost:9000/ws"
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully")
            
            # Test subscribe command
            await websocket.send("subscribe")
            response = await websocket.recv()
            print(f"✅ Subscribe response: {response}")
            
            # Test create command
            await websocket.send("create")
            response = await websocket.recv()
            print(f"✅ Create command response: {response}")
            
            # Listen for a few seconds to see if we get any transaction events
            print("Listening for transaction events (5 seconds)...")
            start_time = time.time()
            while time.time() - start_time < 5:
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                    print(f"📡 Received event: {response}")
                except asyncio.TimeoutError:
                    continue
            
            print("✅ WebSocket test completed")
            return True
            
    except Exception as e:
        print(f"❌ WebSocket test error: {e}")
        return False

def main():
    """Run all API tests"""
    print("🚀 Starting Community Coin Server API Tests")
    print("=" * 50)
    
    # Test basic endpoints
    health_ok = test_health_endpoint()
    if not health_ok:
        print("❌ Health check failed. Is the server running?")
        return
    
    tokens_ok = test_get_tokens()
    if not tokens_ok:
        print("❌ Get tokens failed")
        return
    
    # Test token creation
    pub_address = test_create_token()
    if not pub_address:
        print("❌ Token creation failed")
        return
    
    # Test token-specific endpoints
    get_token_ok = test_get_token_by_address(pub_address)
    add_discussion_ok = test_add_discussion(pub_address)
    stake_ok = test_stake_tokens(pub_address)
    reward_pool_ok = test_get_reward_pool(pub_address)
    
    # Test WebSocket
    websocket_ok = asyncio.run(test_websocket())
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print(f"  Health Check: {'✅' if health_ok else '❌'}")
    print(f"  Get Tokens: {'✅' if tokens_ok else '❌'}")
    print(f"  Create Token: {'✅' if pub_address else '❌'}")
    print(f"  Get Token by Address: {'✅' if get_token_ok else '❌'}")
    print(f"  Add Discussion: {'✅' if add_discussion_ok else '❌'}")
    print(f"  Stake Tokens: {'✅' if stake_ok else '❌'}")
    print(f"  Get Reward Pool: {'✅' if reward_pool_ok else '❌'}")
    print(f"  WebSocket: {'✅' if websocket_ok else '❌'}")
    
    all_passed = all([health_ok, tokens_ok, pub_address, get_token_ok, 
                     add_discussion_ok, stake_ok, reward_pool_ok, websocket_ok])
    
    if all_passed:
        print("\n🎉 All tests passed! The backend is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the server logs for more details.")

if __name__ == "__main__":
    main() 