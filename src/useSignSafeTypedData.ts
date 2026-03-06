import { useState, useCallback } from 'react';
import { useSignTypedData, useAccount } from 'wagmi';
import { isAddress, isHex } from 'viem';

export function useSignSafeTypedData(
  safeAddress: `0x${string}`,
  chainId: number,
  txData: SafeTxData,
  appendLog: (log: string) => void,
  safeVersion: string | null
): UseSignSafeTypedDataResult {
  const isV130Plus = safeVersion ? safeVersion.startsWith('1.3') || safeVersion.startsWith('1.4') || safeVersion.startsWith('1.5') : false;
  const [signature, setSignature] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>(null);

  const { signTypedDataAsync } = useSignTypedData();
  const { address: connectedAddress } = useAccount();

  const signTypedData = useCallback(
    async (account: `0x${string}`): Promise<`0x${string}`> => {
      setIsLoading(true);
      setError(null);

      try {
        if (!isAddress(safeAddress)) {
          throw new Error('Invalid Safe address');
        }
        if (!isAddress(txData.to)) {
          throw new Error('Invalid to address');
        }
        if (!isAddress(txData.gasToken)) {
          throw new Error('Invalid gasToken address');
        }
        if (!isAddress(txData.refundReceiver)) {
          throw new Error('Invalid refundReceiver address');
        }
        if (!isHex(txData.data)) {
          throw new Error('Invalid data: must be a hex string');
        }
        if (!isAddress(account)) {
          throw new Error('Invalid account address');
        }
        if (chainId === undefined) {
          throw new Error('Chain ID not available');
        }

        if (connectedAddress?.toLowerCase() !== account.toLowerCase()) {
          while (true) {
            const userConfirmed = window.confirm(
              `Please switch to the account ${account} in your wallet (e.g., MetaMask) and then click OK to proceed. Cancel to abort.`
            );
            if (!userConfirmed) {
              throw new Error('User aborted account switch');
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (connectedAddress?.toLowerCase() === account.toLowerCase()) {
              appendLog(`Account switch detected: ${connectedAddress}`);
              break;
            }
            appendLog(`Account not switched yet, prompting again...`);
          }
        }

        const types = {
          SafeTx: [
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'data', type: 'bytes' },
            { name: 'operation', type: 'uint8' },
            { name: 'safeTxGas', type: 'uint256' },
            { name: 'baseGas', type: 'uint256' },
            { name: 'gasPrice', type: 'uint256' },
            { name: 'gasToken', type: 'address' },
            { name: 'refundReceiver', type: 'address' },
            { name: 'nonce', type: 'uint256' },
          ],
        };

        const domain = isV130Plus
          ? { chainId, verifyingContract: safeAddress } as const
          : { verifyingContract: safeAddress } as const;

        const message = {
          to: txData.to,
          value: BigInt(txData.value),
          data: txData.data,
          operation: txData.operation,
          safeTxGas: BigInt(txData.safeTxGas),
          baseGas: BigInt(txData.baseGas),
          gasPrice: BigInt(txData.gasPrice),
          gasToken: txData.gasToken,
          refundReceiver: txData.refundReceiver,
          nonce: BigInt(txData.nonce),
        };

        const typedData = {
          types,
          domain,
          primaryType: 'SafeTx',
          message,
        };

        appendLog(`Typed data prepared: ${JSON.stringify(typedData, (_, value: unknown) => typeof value === 'bigint' ? value.toString() : value, 2)}`);

        // @ts-expect-error: broken generic inference on typeof 'domain'
        const signatureResult = await signTypedDataAsync({
          ...typedData
        });

        setSignature(signatureResult);
        setDebugInfo({
          safeAddress,
          chainId,
          txData: message,
          rawTxData: txData,
          typedData,
          walletResponse: { signature: signatureResult },
        });

        appendLog(`Signature obtained: ${signatureResult}`);
        return signatureResult;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        appendLog(`Signature error: ${errorMessage}`);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [safeAddress, chainId, txData, appendLog, signTypedDataAsync, connectedAddress, isV130Plus]
  );

  return { signature, error, isLoading, signTypedData, debugInfo };
}
