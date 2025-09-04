import hashlib

# Replace with the exact snake_case name from your Rust code
instruction_name = "extend_account"
identifier = f"global:{instruction_name}".encode('utf-8')

hash_object = hashlib.sha256(identifier)
discriminator_bytes = hash_object.digest()[:8] # Get first 8 bytes

# Print as a Rust-style array
print(f"Instruction: {instruction_name}")
print(f"Discriminator: [{', '.join(map(str, discriminator_bytes))}]")