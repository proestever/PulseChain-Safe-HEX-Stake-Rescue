import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSignSafeTypedData } from './useSignSafeTypedData.ts';
import { isAddress } from 'viem';

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

interface Signature {
  account: `0x${string}`;
  signature: `0x${string}`;
}

interface UseHexStakeEndSignaturesResult {
  signatures: Signature[];
  combinedSignatures: `0x${string}` | null;
  error: string | null;
  isLoading: boolean;
  collectSignatures: (account: `0x${string}`) => Promise<void>;
}

/**
 * Hook to collect and manage signatures for Safe transactions.
 */
export function useHexStakeEndSignatures(
  txData: SafeTxData,
  chainId: number,
  appendLog: (log: string) => void,
  safeAddress: `0x${string}`,
  safeVersion: string | null
): UseHexStakeEndSignaturesResult {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [logQueue, setLogQueue] = useState<string[]>([]);

  const { signTypedData, error: signError, isLoading: signLoading } = useSignSafeTypedData(
    safeAddress,
    chainId,
    txData,
    appendLog,
    safeVersion
  );

  useEffect(() => {
    if (logQueue.length > 0) {
      const uniqueLogs = Array.from(new Set(logQueue));
      uniqueLogs.forEach((log) => appendLog(log));
      setLogQueue([]);
    }
  }, [logQueue, appendLog]);

  const collectSignatures = useCallback(
    async (account: `0x${string}`) => {
      if (isLoading) {
        setLogQueue((prev) => [...prev, `Signature collection in progress, skipping for ${account}`]);
        return;
      }
      setIsLoading(true);
      setError(null);

      try {
        if (!isAddress(account)) {
          throw new Error('Invalid account address');
        }

        const signature = await signTypedData(account);
        setSignatures((prev) => {
          if (prev.some((sig) => sig.account.toLowerCase() === account.toLowerCase())) {
            setLogQueue((prevQueue) => [...prevQueue, `Signature for ${account} already exists, skipping`]);
            return prev;
          }

          const newSignatures = [...prev, { account, signature }].sort((a, b) =>
            a.account.toLowerCase() < b.account.toLowerCase() ? -1 : 1
          );
          setLogQueue((prevQueue) => [...prevQueue, `Added signature for ${account}. Total signatures: ${newSignatures.length}`]);
          return newSignatures;
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setLogQueue((prevQueue) => [...prevQueue, `Failed to collect signature for ${account}: ${errorMessage}`]);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [signTypedData, isLoading]
  );

  const combinedSignatures = useMemo(() => {
    if (signatures.length === 0) return null;
    const sortedSignatures = signatures
      .sort((a, b) => (a.account.toLowerCase() < b.account.toLowerCase() ? -1 : 1))
      .map((sig) => sig.signature)
      .join('');
    return `0x${sortedSignatures.replace(/0x/g, '')}`;
  }, [signatures]) as `0x${string}`;

  useEffect(() => {
    if (signError) {
      setLogQueue((prev) => [...prev, `Signature error: ${signError}`]);
    }
  }, [signError]);

  return { signatures, combinedSignatures, error, isLoading: signLoading || isLoading, collectSignatures };
}
