import requests
import json
import os

# --- Configuration ---
# Replace with your actual Helius API key
# It's recommended to use environment variables for API keys
# Example: Set HELIUS_API_KEY environment variable
HELIUS_API_KEY = "c9108d6b-a742-44c0-862a-2da912d111e5" #os.getenv("HELIUS_API_KEY", "YOUR_HELIUS_API_KEY_HERE")

# Replace with the Solana address (account public key) you want to fetch info for
ADDRESS_TO_FETCH = "TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM" # e.g., "So11111111111111111111111111111111111111112"

# --- Helius API Endpoint ---
HELIUS_API_BASE_URL = "https://api.helius.xyz"
# Note: Address is part of the URL path for this endpoint
ADDRESS_INFO_ENDPOINT_TEMPLATE = f"{HELIUS_API_BASE_URL}/v0/addresses/{{address}}/info?api-key={HELIUS_API_KEY}"

# --- Function to Fetch Address Info ---
def get_address_info(address: str):
    """
    Fetches information for a given Solana address using the Helius API.

    Args:
        address: The Solana address (public key) as a string.

    Returns:
        A dictionary containing the address information if successful, None otherwise.
    """
    if HELIUS_API_KEY == "YOUR_HELIUS_API_KEY_HERE":
        print("Error: Please replace 'YOUR_HELIUS_API_KEY_HERE' with your actual Helius API key.")
        return None
    if address == "YOUR_SOLANA_ADDRESS_HERE":
        print("Error: Please replace 'YOUR_SOLANA_ADDRESS_HERE' with an actual Solana address.")
        return None

    print(f"Fetching info for address: {address}")

    # Construct the specific endpoint URL for this address
    endpoint_url = ADDRESS_INFO_ENDPOINT_TEMPLATE.format(address=address)

    try:
        # Make the GET request to the Helius API
        response = requests.get(endpoint_url)

        # Raise an exception for bad status codes (4xx or 5xx)
        response.raise_for_status()

        # Parse the JSON response
        data = response.json()

        # Check if data is returned (Helius usually returns an object directly here)
        if data:
            return data
        else:
            print(f"Error: Address not found or unexpected empty response for address: {address}")
            print("Response:", data)
            return None

    except requests.exceptions.RequestException as e:
        print(f"Error making request to Helius API: {e}")
        # Check for specific status codes if available
        if hasattr(e, 'response') and e.response is not None:
            print(f"Status Code: {e.response.status_code}")
            try:
                # Attempt to parse JSON error details from Helius if available
                error_details = e.response.json()
                print(f"Response Body: {json.dumps(error_details, indent=2)}")
            except json.JSONDecodeError:
                # Fallback to plain text if JSON parsing fails
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
    address_info = get_address_info(ADDRESS_TO_FETCH)

    if address_info:
        print("\n--- Address Information ---")
        # Pretty print the JSON details
        print(json.dumps(address_info, indent=2))
        print("\n--------------------------")

