Before in
apt-get install ca-certificates

RUST
1.86

INSTALL SOLANA
sh -c "$(curl -sSfL https://release.anza.xyz/v2.1.0/install)"

cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

FOR GLIBC 2.38
avm 0.31.0
anchor 0.31.0

FOR GLIBC 2.36
avm install 0.30.1
anchor 0.30.1

anchor init --test-template rust token_creation

anchor init --test-template rust coin_create

if anchor build give error: no such command: `build-sbf`
export PATH=~/.local/share/solana/install/active_release/bin:$PATH


LOCAL SOL EXPLORER:
https://explorer.solana.com/address/EJdcnkTKogTPuRDj3QZMYNUxCinjtYnERzmk65yjvDkC?cluster=custom

FIND BALANCE:
solana balance /root/.config/solana/id.json or solana balance 

TO chhange url for solana:
solana config set --url localhost

TO get current config
solana config get

avm 0.31.1
IF anchor build fails:
    PROBLEM:
    let source_path = proc_macro2::Span::call_site().source_file().path();
        |                                                                  ^^^^^^^^^^^ method not found in `Span`

    For more information about this error, try `rustc --explain E0599`.

    SOLUTION:
    rustup update
    cargo update -p proc-macro2 --precise 1.0.95
    anchro 0.31.1
    rustup - 2025-04-21 nightly
    anchor - 0.31.1
    solana - 2.14.0
    proc-macro2 - 1.0.95


    anchor idl build -o target/idl/coin_create.json -t target/types/coin_create.ts


    NO IDL
    anchor build --no-idl
    RUSTUP_TOOLCHAIN=nightly-2025-04-01 anchor idl build -o target/idl/coin_create.json  -t 

cargo fix --lib -p coin_create

EXAMPLE ANCHOR PROGRAM CREATE TOKEN
https://github.com/solana-developers/program-examples/blob/main/tokens/create-token/anchor



