import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http, fallback } from 'wagmi'
import { mainnet, pulsechain } from 'wagmi/chains'

const projectId = '86811378e80acfdf63c532c6e5cdcef0'

export const config = getDefaultConfig({
  appName: 'PulseChain Safe HEX Stake Rescue',
  projectId,
  chains: [pulsechain, mainnet],
  transports: {
    [pulsechain.id]: fallback([
      http('https://rpc.pulsechain.com'),
      http('https://rpc-pulsechain.g4mm4.io'),
      http('https://pulsechain-rpc.publicnode.com'),
    ]),
    [mainnet.id]: fallback([
      http('https://eth.llamarpc.com'),
      http('https://ethereum-rpc.publicnode.com'),
      http(),
    ]),
  },
});
