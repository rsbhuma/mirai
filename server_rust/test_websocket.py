#!/usr/bin/env python3
"""
Simple WebSocket test client for the Community Coin Server
"""

import asyncio
import websockets
import json
import sys

async def test_websocket():
    uri = "ws://localhost:9000/api/ws"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WebSocket server")
            
            # Test subscribe command
            print("\n1. Testing subscribe command...")
            await websocket.send("subscribe")
            response = await websocket.recv()
            print(f"Response: {response}")
            
            # Test create command
            print("\n2. Testing create command...")
            await websocket.send("create")
            response = await websocket.recv()
            print(f"Response: {response}")
            
            # Test buy command
            print("\n3. Testing buy command...")
            await websocket.send("buy")
            response = await websocket.recv()
            print(f"Response: {response}")
            
            # Test sell command
            print("\n4. Testing sell command...")
            await websocket.send("sell")
            response = await websocket.recv()
            print(f"Response: {response}")
            
            # Test unknown command
            print("\n5. Testing unknown command...")
            await websocket.send("unknown")
            response = await websocket.recv()
            print(f"Response: {response}")
            
            # Listen for transaction events for 10 seconds
            print("\n6. Listening for transaction events for 10 seconds...")
            try:
                # Use asyncio.wait_for for older Python versions
                async def listen_for_events():
                    while True:
                        response = await websocket.recv()
                        print(f"Transaction event: {response}")
                
                await asyncio.wait_for(listen_for_events(), timeout=10.0)
            except asyncio.TimeoutError:
                print("Timeout reached, no more events")
                
    except websockets.exceptions.ConnectionClosed:
        print("Error: Could not connect to WebSocket server. Make sure the server is running on localhost:9000")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("Community Coin Server WebSocket Test Client")
    print("=" * 50)
    asyncio.run(test_websocket()) 