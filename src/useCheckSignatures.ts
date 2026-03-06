import { useState, useCallback } from 'react';
import { parseAbi, isAddress, isHex, hexToBytes } from 'viem';
import type { PublicClient } from 'viem';

interface CheckSignaturesResult {
  isValid: boolean | null;
  error: string | null;
  isLoading: boolean;
  checkSignatures: (
    dataHash: `0x${string}`,
    data: `0x${string}`,
    signatures: `0x${string}`,
    requiredSignatures: number
  ) => Promise<void>;
}

// v1.3.0+: checkNSignatures has 4 args
const SAFE_ABI_V130 = parseAbi([
  'function checkNSignatures(bytes32 dataHash, bytes data, bytes signatures, uint256 requiredSignatures) view',
]);

export function useCheckSignatures(
  safeAddress: `0x${string}`,
  publicClient: PublicClient | null,
  appendLog: (log: string) => void,
  safeVersion: string | null
): CheckSignaturesResult {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isV130Plus = safeVersion ? safeVersion.startsWith('1.3') || safeVersion.startsWith('1.4') || safeVersion.startsWith('1.5') : false;

  const checkSignatures = useCallback(
    async (dataHash: `0x${string}`, data: `0x${string}`, signatures: `0x${string}`, requiredSignatures: number) => {
      setIsLoading(true);
      setError(null);
      setIsValid(null);

      try {
        if (!publicClient || !isAddress(safeAddress)) {
          throw new Error('Invalid public client or Safe address');
        }
        if (!isHex(dataHash) || dataHash.length !== 66) {
          throw new Error('Invalid dataHash');
        }
        if (!isHex(signatures)) {
          throw new Error('Invalid signatures');
        }

        const sigBytes = hexToBytes(signatures);
        if (sigBytes.length % 65 !== 0) {
          throw new Error(`Invalid signatures length: ${sigBytes.length}, expected multiple of 65 bytes`);
        }

        if (isV130Plus) {
          // v1.3.0+ has checkNSignatures as a public view function
          appendLog(`Using checkNSignatures (v1.3.0+) for pre-verification`);
          try {
            await publicClient.readContract({
              address: safeAddress,
              abi: SAFE_ABI_V130,
              functionName: 'checkNSignatures',
              args: [dataHash, data, signatures, BigInt(requiredSignatures)],
            });
            setIsValid(true);
            appendLog(`Signatures verified valid on-chain`);
          } catch (err) {
            const reason = err instanceof Error ? err.message : 'Unknown error';
            setIsValid(false);
            appendLog(`checkNSignatures failed: ${reason}`);
            throw err;
          }
        } else {
          // v1.1.1 and StakerApp builds often don't expose checkSignatures publicly.
          // execTransaction does its own internal signature verification, so we skip
          // pre-verification and let the broadcast handle it.
          appendLog(`Safe v${safeVersion} — skipping pre-verification (not available on this contract). execTransaction will verify signatures internally when broadcast.`);
          setIsValid(true);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setIsValid(false);
        appendLog(`Signature verification failed: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    },
    [safeAddress, publicClient, appendLog, safeVersion, isV130Plus]
  );

  return { isValid, error, isLoading, checkSignatures };
}
