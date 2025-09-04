import requests
import json
import os

# --- Configuration ---
# Replace with your actual Helius API key
# It's recommended to use environment variables for API keys
# Example: Set HELIUS_API_KEY environment variable
HELIUS_API_KEY = "c9108d6b-a742-44c0-862a-2da912d111e5"#os.getenv("HELIUS_API_KEY", "YOUR_HELIUS_API_KEY_HERE")

# Replace with the Solana transaction signature (ID) you want to fetch
TRANSACTION_SIGNATURE = "4onBJ3sb91zsXkXoLnBRBhPqX1DLbRcEbKzQxDcHkJd5Ai4p1k4wvvSaBaHk7by5BXKcCDg7Tx4Hphhpyt7aQuem"

# --- Helius API Endpoint ---
# Using the v0 endpoint for parsed transaction details
HELIUS_API_BASE_URL = "https://api.helius.xyz"
TRANSACTION_ENDPOINT = f"{HELIUS_API_BASE_URL}/v0/transactions/?api-key={HELIUS_API_KEY}"

# --- Function to Fetch Transaction Details ---
def get_transaction_details(signature: str):
    """
    Fetches detailed information for a given Solana transaction signature using the Helius API.

    Args:
        signature: The transaction signature (ID) as a string.

    Returns:
        A dictionary containing the transaction details if successful, None otherwise.
    """
    if HELIUS_API_KEY == "YOUR_HELIUS_API_KEY_HERE":
        print("Error: Please replace 'YOUR_HELIUS_API_KEY_HERE' with your actual Helius API key.")
        return None
    if signature == "YOUR_TRANSACTION_SIGNATURE_HERE":
        print("Error: Please replace 'YOUR_TRANSACTION_SIGNATURE_HERE' with an actual transaction signature.")
        return None

    print(f"Fetching details for transaction: {signature}")

    # Prepare the request payload
    payload = {
        "transactions": [signature]
    }

    try:
        # Make the POST request to the Helius API
        response = requests.post(TRANSACTION_ENDPOINT, json=payload)

        # Raise an exception for bad status codes (4xx or 5xx)
        response.raise_for_status()

        # Parse the JSON response
        data = response.json()

        # Helius returns a list, even for one transaction
        if data and isinstance(data, list) and len(data) > 0:
            return data[0] # Return the details for the first (and only) transaction
        else:
            print(f"Error: Transaction not found or unexpected response format for signature: {signature}")
            print("Response:", data)
            return None

    except requests.exceptions.RequestException as e:
        print(f"Error making request to Helius API: {e}")
        # Check for specific status codes if available
        if hasattr(e, 'response') and e.response is not None:
            print(f"Status Code: {e.response.status_code}")
            try:
                print(f"Response Body: {e.response.json()}")
            except json.JSONDecodeError:
                print(f"Response Body: {e.response.text}")
        return None
    except json.JSONDecodeError:
        print("Error: Failed to decode JSON response from Helius API.")
        print("Raw Response:", response.text if 'response' in locals() else "N/A")
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return None

# --- Main Execution ---
if __name__ == "__main__":
    transaction_details = get_transaction_details(TRANSACTION_SIGNATURE)

    if transaction_details:
        print("\n--- Transaction Details ---")
        # Pretty print the JSON details
        print(json.dumps(transaction_details, indent=2))
        print("\n--------------------------")
