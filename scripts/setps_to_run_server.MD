cd server_rust
docker-compose build -t commuinty_coin_custom_server
docker run -it -v $PWD:/code --net=host commuinty_coin_custom_server bash
/code/server_rust# ./start_server.sh 


./scripts/setup-localnet-e2e_v2.sh
docker exec -it <contract_server> bash
cd /workspace_other/commcoin
cp ../test/data/solanaconfig/id.json ~/.config/solana/id.json
solana config set --url http://0.0.0.0:8899
solana config set --keypair ~/.config/solana/id.json


solana airdrop 10 --keypair ../test/data/wallets/user.json 
solana airdrop 10 --keypair ../test/data/solana_config/id.json

apt-get update

anchor build
chane config in test/commcoin.ts and only enable line no 
  it('Create an PDA!', async () => {
    // Generate new keypair to use as address for mint account.

    const newConfig = {};


    // SPL Token default = 9 decimals
    const transactionSignature = await program.methods
      .configure(newConfig)
      .accounts({
        admin: adminKeyPair.publicKey,
      })
      .signers([adminKeyPair])
      .rpc();

    console.log('Success!');
    console.log(`   admin Address: ${adminKeyPair.publicKey}`);
    console.log(`   Transaction Signature: ${transactionSignature}`);
  });

check if solan is able to connect
solana ping

apt-get update

and run 
anchor test --no-idl --skip-local-validator

fortend:
run node
cd /code/client4/project/ 
yarn install
yarn dev