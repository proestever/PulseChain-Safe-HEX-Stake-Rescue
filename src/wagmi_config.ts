import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http, fallback } from 'wagmi'
import { mainnet, pulsechain } from 'wagmi/chains'

const projectId = '86811378e80acfdf63c532c6e5cdcef0'

const pulsechainWithIcon = {
  ...pulsechain,
  iconUrl: `${import.meta.env.BASE_URL}pulsechain-logo.svg`,
}

const mainnetWithIcon = {
  ...mainnet,
  iconUrl: `${import.meta.env.BASE_URL}ethereum-logo.svg`,
}

export const config = getDefaultConfig({
  appName: 'PulseChain Safe HEX Stake Rescue',
  projectId,
  chains: [pulsechainWithIcon, mainnetWithIcon],
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
