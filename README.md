# PulseChain Safe HEX Stake Rescue

A frontend dApp to help PulseChain and Ethereum users end HEX stakes locked in Gnosis Safe (StakerApp) wallets.

## About

Safe (formerly Gnosis Safe) was used by the HEX community's now-defunct StakerApp. This dApp lets you end HEX stakes held in a Safe smart contract wallet and recover the resulting HEX balance. It works on both Ethereum and PulseChain.

### Features

- Supports Safe v1.1.1 (StakerApp) and v1.3.0+
- Two signing methods: EIP-712 typed data signing and on-chain `approveHash`
- Works with MetaMask, Rabby, and other wallets via RainbowKit/WalletConnect
- Native PLS/ETH transfers and HEX token transfers from the Safe
- Multi-signature Safe support (all signing within a single session)

## Usage

1. Connect your wallet (the Safe owner/signer account)
2. Enter your Safe contract address
3. Select the stake to end
4. Sign and broadcast the transaction

For StakerApp users: create an instance of your StakerApp signing wallet (first account from your seed phrase) in MetaMask or similar, then provide the internal Safe address.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Tech Stack

- React + TypeScript + Vite
- wagmi + viem for blockchain interaction
- RainbowKit for wallet connection
- Material UI for components
