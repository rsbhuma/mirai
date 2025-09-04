import hashlib

identifier = b"global:extend_account" # Use the correct instruction name
hash_object = hashlib.sha256(identifier)
discriminator_bytes = hash_object.digest()[:8] # Get first 8 bytes

# Print as a Rust-style array
print(f"[{', '.join(map(str, discriminator_bytes))}]")
# Example output: [171, 187, 204, 221, 238, 255, 0, 17]