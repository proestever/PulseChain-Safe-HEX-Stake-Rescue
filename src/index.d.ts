// common
type DebugInfo = object | string | null;

interface SafeTxData {
  to: `0x${string}`;
  value: string;
  data: `0x${string}`;
  operation: 0 | 1;
  safeTxGas: string;
  baseGas: string;
  gasPrice: string;
  gasToken: `0x${string}`;
  refundReceiver: `0x${string}`;
  nonce: string;
}

// useSignSafeTypedDataResult.ts
interface UseSignSafeTypedDataResult {
  signature: `0x${string}` | null;
  error: string | null;
  isLoading?: boolean;
  signTypedData: (account: `0x${string}`) => Promise<`0x${string}`>;
  debugInfo: DebugInfo;
}

// useSafeInfo
interface SafeInfoResult {
  owners: `0x${string}`[];
  threshold: number;
  hexBalance: bigint;
  balance: bigint;
  error: string | null;
  isLoading: boolean;
}

// useHexStakeEndSignatures.d.ts
interface HexStakeEndSignaturesResult {
  signatures: { account: `0x${string}`; signature: `0x${string}` }[];
  combinedSignatures: `0x${string}` | null;
  error: string | null;
  isLoading: boolean;
  collectSignatures: (account: `0x${string}`) => Promise<void>;
}
