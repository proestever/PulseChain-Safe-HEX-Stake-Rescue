import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Divider,
  Alert,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import { useAccount, useChainId, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
  decodeFunctionData,
  parseAbi,
  type PublicClient,
  formatUnits,
} from "viem";
import { useSafeInfo } from "./useSafeInfo";
import { useHexStakeEndSignatures } from "./useHexStakeEndSignatures";
import { useCheckSignatures } from "./useCheckSignatures";
import { DOMAIN_SEPARATOR_TYPEHASH_V130, DOMAIN_SEPARATOR_TYPEHASH_V111, SAFE_TX_TYPEHASH } from "./constants";

const HEX_ABI = parseAbi([
  "function stakeEnd(uint256 stakeIndex, uint40 stakeIdParam)",
  "function transfer(address to, uint256 value)",
]);

const SAFE_ABI = parseAbi([
  "function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures) returns (bool success)",
  "function approveHash(bytes32 hashToApprove)",
  "function approvedHashes(address owner, bytes32 hash) view returns (uint256)",
]);

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

export function TransactionSigner({
  appendLog,
  txData,
  safeAddress,
  onClose,
  onStatusChange,
  onTransactionConfirmed,
}: {
  appendLog: (log: string) => void;
  txData: SafeTxData;
  safeAddress: `0x${string}`;
  onClose: () => void;
  onStatusChange: (status: { isBroadcast: boolean; isConfirmed: boolean }) => void;
  onTransactionConfirmed: () => void;
}) {
  const { isConnected, address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient() as PublicClient;
  const { writeContract, data: txHash, error: writeError, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const { owners, threshold, error: safeError, isSafeLoading, safeVersion } = useSafeInfo(safeAddress, publicClient);
  const isV130Plus = safeVersion ? safeVersion.startsWith('1.3') || safeVersion.startsWith('1.4') || safeVersion.startsWith('1.5') : false;

  const {
    signatures,
    combinedSignatures,
    error: sigError,
    isLoading: sigLoading,
    collectSignatures,
  } = useHexStakeEndSignatures(txData, chainId, appendLog, safeAddress, safeVersion);

  const {
    isValid,
    error: checkError,
    isLoading: checkLoading,
    checkSignatures,
  } = useCheckSignatures(safeAddress, publicClient, appendLog, safeVersion);

  const [shouldVerify, setShouldVerify] = useState(false);
  // Default to Approve Hash for v1.1.1 Safes (PulseChain/StakerApp), EIP-712 for v1.3.0+
  const [useApproveHash, setUseApproveHash] = useState(true);
  const [methodAutoSet, setMethodAutoSet] = useState(false);
  const [approveHashDone, setApproveHashDone] = useState(false);
  const { writeContract: writeApproveHash, data: approveHashTx, error: approveHashError, isPending: isApprovingHash } = useWriteContract();
  const { isSuccess: approveHashConfirmed } = useWaitForTransactionReceipt({ hash: approveHashTx });
  const [txDetails, setTxDetails] = useState<{ functionName: string; [key: string]: string }>({
    functionName: "unknown",
  });

  const nativeCoinSymbol = chainId === 369 ? "PLS" : chainId === 1 ? "ETH" : "Native Coin";

   const validateChainId = () => {
    if (!chainId) {
      appendLog("Chain ID not available, cannot compute safeTxHash");
      return false;
    }
    return true;
  };

  const domainSeparator = safeVersion
    ? isV130Plus
      ? keccak256(
          encodeAbiParameters(parseAbiParameters("bytes32, uint256, address"), [
            DOMAIN_SEPARATOR_TYPEHASH_V130,
            BigInt(chainId),
            safeAddress,
          ])
        )
      : keccak256(
          encodeAbiParameters(parseAbiParameters("bytes32, address"), [
            DOMAIN_SEPARATOR_TYPEHASH_V111,
            safeAddress,
          ])
        )
    : null;

  const safeTxHash = chainId
    ? keccak256(
        encodeAbiParameters(
          parseAbiParameters(
            "bytes32, address, uint256, bytes32, uint8, uint256, uint256, uint256, address, address, uint256"
          ),
          [
            SAFE_TX_TYPEHASH,
            txData.to,
            BigInt(txData.value),
            keccak256(txData.data),
            txData.operation,
            BigInt(txData.safeTxGas),
            BigInt(txData.baseGas),
            BigInt(txData.gasPrice),
            txData.gasToken,
            txData.refundReceiver,
            BigInt(txData.nonce),
          ]
        )
      )
    : null;

  const verifySignatures = useCallback(() => {
    if (combinedSignatures && signatures.length >= threshold && domainSeparator && safeTxHash) {
      const packedData = "0x1901" + domainSeparator.slice(2) + safeTxHash.slice(2);
      const finalHash = keccak256(packedData as `0x${string}`);

      appendLog(`Initiating signature verification with safeTxHash: ${finalHash}`);
      checkSignatures(finalHash, txData.data, combinedSignatures, threshold).catch((err) =>
        appendLog(`Signature verification error: ${err instanceof Error ? err.message : "Unknown error"}`)
      );
    }
  }, [combinedSignatures, signatures, threshold, domainSeparator, safeTxHash, txData.data, checkSignatures, appendLog]);

  // Auto-select signing method based on Safe version
  useEffect(() => {
    if (safeVersion && !methodAutoSet) {
      setUseApproveHash(!isV130Plus);
      setMethodAutoSet(true);
      appendLog(`Safe version ${safeVersion} detected — defaulting to ${isV130Plus ? 'EIP-712' : 'Approve Hash'}`);
    }
  }, [safeVersion, isV130Plus, methodAutoSet, appendLog]);

  // chainInfo effect
  useEffect(() => {
    appendLog(`Using chainId: ${chainId}`);
    if (domainSeparator) {
      appendLog(`Calculated domainSeparator: ${domainSeparator}`);
    }
    if (safeTxHash) {
      appendLog(`Calculated safeTxHash: ${safeTxHash}`);
    }
  }, [chainId, domainSeparator, safeTxHash, appendLog]);

  // txDecode effect
  useEffect(() => {
    if (txData.data === "0x") {
      setTxDetails({
        functionName: "Native Transfer",
        to: txData.to,
        amount: Number(formatUnits(BigInt(txData.value), 18)).toFixed(4),
      });
      appendLog(
        `Detected native ${nativeCoinSymbol} transfer to ${txData.to} for ${Number(
          formatUnits(BigInt(txData.value), 18)
        ).toFixed(4)} ${nativeCoinSymbol}`
      );
    } else {
      try {
        const decoded = decodeFunctionData({
          abi: HEX_ABI,
          data: txData.data,
        });
        if (decoded.functionName === "stakeEnd") {
          setTxDetails({
            functionName: "stakeEnd",
            stakeIndex: decoded.args[0].toString(),
            stakeId: decoded.args[1].toString(),
          });
          appendLog(`Decoded transaction: stakeEnd with stakeIndex ${decoded.args[0]}, stakeId ${decoded.args[1]}`);
        } else if (decoded.functionName === "transfer") {
          setTxDetails({
            functionName: "transfer",
            to: decoded.args[0].toString(),
            amount: Number(formatUnits(decoded.args[1], 8)).toFixed(4),
          });
          appendLog(
            `Decoded transaction: transfer of ${Number(formatUnits(decoded.args[1], 8)).toFixed(4)} HEX to ${
              decoded.args[0]
            }`
          );
        }
      } catch (err) {
        setTxDetails({ functionName: "unknown" });
        appendLog(`Error decoding transaction data: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  }, [txData.data, txData.to, txData.value, nativeCoinSymbol, appendLog]);

  // safeError effect
  useEffect(() => {
    if (safeError) {
      appendLog(`Safe info error: ${safeError}`);
    }
  }, [safeError, appendLog]);

  // txStatus effect
  useEffect(() => {
    if (writeError) {
      appendLog(`Transaction broadcast error: ${writeError.message}`);
    }
    if (txHash) {
      appendLog(`Transaction broadcasted: ${txHash}`);
    }
    if (isConfirmed) {
      appendLog("Transaction confirmed on-chain");
      onStatusChange({ isBroadcast: true, isConfirmed: true });
      onTransactionConfirmed();
    }
  }, [writeError, txHash, isConfirmed, appendLog, onStatusChange, onTransactionConfirmed]);

  // signature verification effect
  useEffect(() => {
    if (shouldVerify && combinedSignatures && signatures.length >= threshold) {
      appendLog("Triggering signature verification");
      verifySignatures();
    }
  }, [shouldVerify, combinedSignatures, signatures, threshold, verifySignatures, appendLog]);

  // approveHash confirmation effect
  useEffect(() => {
    if (approveHashConfirmed) {
      appendLog("approveHash confirmed on-chain");
      setApproveHashDone(true);
    }
    if (approveHashError) {
      appendLog(`approveHash error: ${approveHashError.message}`);
    }
  }, [approveHashConfirmed, approveHashError, appendLog]);

  const handleApproveHash = useCallback(() => {
    if (!domainSeparator || !safeTxHash) {
      appendLog("Cannot compute hash — domain separator or safeTxHash not ready");
      return;
    }
    const packedData = "0x1901" + domainSeparator.slice(2) + safeTxHash.slice(2);
    const finalHash = keccak256(packedData as `0x${string}`);
    appendLog(`Calling approveHash with hash: ${finalHash}`);
    writeApproveHash({
      address: safeAddress,
      abi: SAFE_ABI,
      functionName: "approveHash",
      args: [finalHash],
    });
  }, [domainSeparator, safeTxHash, safeAddress, writeApproveHash, appendLog]);

  const broadcastWithApprovedHash = useCallback(() => {
    if (!connectedAddress) return;
    // For pre-approved hashes, the signature format is:
    // r = owner address (padded to 32 bytes), s = 0, v = 1
    const r = connectedAddress.toLowerCase().replace("0x", "").padStart(64, "0");
    const s = "0000000000000000000000000000000000000000000000000000000000000000";
    const v = "01";
    const approvedSig = `0x${r}${s}${v}` as `0x${string}`;
    appendLog(`Broadcasting with pre-approved hash signature (gas: 7000000)`);
    writeContract({
      address: safeAddress,
      abi: SAFE_ABI,
      functionName: "execTransaction",
      args: [
        txData.to,
        BigInt(txData.value),
        txData.data,
        txData.operation,
        BigInt(txData.safeTxGas),
        BigInt(txData.baseGas),
        BigInt(txData.gasPrice),
        txData.gasToken,
        txData.refundReceiver,
        approvedSig,
      ],
      gas: 7_000_000n,
    });
    onStatusChange({ isBroadcast: true, isConfirmed: false });
  }, [connectedAddress, safeAddress, txData, writeContract, onStatusChange, appendLog]);

  const broadcastTransaction = useCallback(() => {
    appendLog("Initiating transaction broadcast");
    try {
      if (!isConnected || !connectedAddress) {
        throw new Error("No wallet connected");
      }
      if (!combinedSignatures) {
        throw new Error("No combined signatures available");
      }
      if (safeError) {
        throw new Error(`Safe error: ${safeError}`);
      }

      writeContract({
        address: safeAddress,
        abi: SAFE_ABI,
        functionName: "execTransaction",
        args: [
          txData.to,
          BigInt(txData.value),
          txData.data,
          txData.operation,
          BigInt(txData.safeTxGas),
          BigInt(txData.baseGas),
          BigInt(txData.gasPrice),
          txData.gasToken,
          txData.refundReceiver,
          combinedSignatures,
        ],
        gas: 7_000_000n,
      });
      onStatusChange({ isBroadcast: true, isConfirmed: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      appendLog(`Transaction broadcast failed: ${errorMessage}`);
    }
  }, [
    isConnected,
    connectedAddress,
    combinedSignatures,
    safeError,
    writeContract,
    safeAddress,
    txData,
    onStatusChange,
    appendLog,
  ]);

  const handleCollectSignature = useCallback(
    (owner: `0x${string}`) => {
      if (!owners.includes(owner)) {
        appendLog(`Invalid owner address: ${owner}`);
        return;
      }
      collectSignatures(owner)
        .then(() => {
          setTimeout(() => {
            setShouldVerify(true);
            appendLog(`Set shouldVerify to true for ${owner}`);
          }, 0);
        })
        .catch((err) => {
          appendLog(`Signature collection error: ${err instanceof Error ? err.message : "Unknown error"}`);
        });
    },
    [owners, collectSignatures, appendLog]
  );

  if (!validateChainId()) {
    return <Alert severity="error">Chain ID not available. Please connect your wallet.</Alert>;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Transaction Details
        </Typography>
        {safeError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {safeError}
          </Alert>
        )}
        {isSafeLoading && <CircularProgress size={20} sx={{ mb: 2 }} />}
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell component="th" scope="row">
                <Typography variant="body2" fontWeight="medium">
                  Function
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{txDetails.functionName}</Typography>
              </TableCell>
            </TableRow>
            {txDetails.functionName === "Native Transfer" && (
              <>
                <TableRow>
                  <TableCell component="th" scope="row">
                    <Typography variant="body2" fontWeight="medium">
                      To Address
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{txDetails.to}</Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    <Typography variant="body2" fontWeight="medium">
                      Amount ({nativeCoinSymbol})
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{txDetails.amount}</Typography>
                  </TableCell>
                </TableRow>
              </>
            )}
            {txDetails.functionName === "stakeEnd" && (
              <>
                <TableRow>
                  <TableCell component="th" scope="row">
                    <Typography variant="body2" fontWeight="medium">
                      Stake Index
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{txDetails.stakeIndex}</Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    <Typography variant="body2" fontWeight="medium">
                      Stake ID
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{txDetails.stakeId}</Typography>
                  </TableCell>
                </TableRow>
              </>
            )}
            {txDetails.functionName === "transfer" && (
              <>
                <TableRow>
                  <TableCell component="th" scope="row">
                    <Typography variant="body2" fontWeight="medium">
                      To Address
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{txDetails.to}</Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    <Typography variant="body2" fontWeight="medium">
                      Amount (HEX)
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{txDetails.amount}</Typography>
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>

        <Divider sx={{ my: 2 }} />

        {!useApproveHash ? (
          <>
            <Typography variant="h6" gutterBottom>
              Method 1: EIP-712 Signature
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Sign this transaction with your wallet. Connect the owner address shown on the button, then click to sign.
              <strong> If your wallet hangs or won't load the signing request, use Method 2 below instead.</strong>
            </Typography>

            {safeError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {safeError}
              </Alert>
            )}
            <Stack direction="row" flexWrap="wrap" spacing={1} mb={2}>
              {owners.map((owner) => {
                const isSigned = signatures.some((sig) => sig.account === owner);
                const isCurrentUser = connectedAddress?.toLowerCase() === owner.toLowerCase();
                const disabled =
                  sigLoading ||
                  isSafeLoading ||
                  !!safeError ||
                  !publicClient ||
                  isSigned ||
                  signatures.length >= threshold ||
                  !isCurrentUser;

                return (
                  <Button
                    key={owner}
                    variant="outlined"
                    size="small"
                    disabled={disabled}
                    onClick={() => handleCollectSignature(owner)}
                    aria-label={`Sign transaction with owner ${owner}`}
                  >
                    {sigLoading && isCurrentUser
                      ? "Collecting Signature..."
                      : `Sign with ${owner.slice(0, 6)}...${owner.slice(-4)}`}
                  </Button>
                );
              })}
            </Stack>
            {sigError && <Alert severity="error">{sigError}</Alert>}
            <Divider sx={{ my: 1 }} />
            {signatures.map((sig, i) => (
              <Typography key={sig.account} variant="body2" sx={{ wordBreak: "break-word", fontFamily: "monospace" }}>
                <strong>
                  Signature {i + 1} ({sig.account}):
                </strong>{" "}
                {sig.signature}
              </Typography>
            ))}

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Verification & Broadcast
            </Typography>
            {checkLoading && <CircularProgress size={20} />}
            {safeError && <Alert severity="error">{safeError}</Alert>}
            {checkError && <Alert severity="error">{checkError}</Alert>}
            {writeError && <Alert severity="error">{writeError.message}</Alert>}
            {isValid !== null && (
              <Alert severity={isValid ? "success" : "error"}>Signatures are {isValid ? "valid" : "invalid"}</Alert>
            )}
            {txHash && <Alert severity="info">Transaction Hash: {txHash}</Alert>}
            {isConfirming && <Alert severity="info">Waiting for transaction confirmation...</Alert>}
            {isConfirmed && <Alert severity="success">Transaction confirmed on-chain</Alert>}
            {isValid && !writeError && !isConfirmed && (
              <Button
                variant="contained"
                color="primary"
                onClick={broadcastTransaction}
                disabled={isWriting || isConfirming || !isConnected || !combinedSignatures || !!safeError}
                sx={{ mt: 2 }}
                aria-label="Broadcast transaction"
              >
                {isWriting || isConfirming ? "Broadcasting..." : "Broadcast Transaction"}
              </Button>
            )}
            {writeError && (
              <Button
                variant="contained"
                color="secondary"
                onClick={onClose}
                sx={{ mt: 2, ml: 2 }}
                aria-label="Close transaction"
              >
                Close
              </Button>
            )}
            {signatures.length > 0 && !isValid && (
              <Button
                variant="contained"
                color="secondary"
                onClick={verifySignatures}
                disabled={checkLoading || sigLoading || isSafeLoading || !!safeError || signatures.length < threshold}
                sx={{ mt: 2, ml: 2 }}
                aria-label="Verify signatures"
              >
                Verify Signatures
              </Button>
            )}

            <Divider sx={{ my: 2 }} />
            <Button variant="text" size="small" onClick={() => setUseApproveHash(true)}>
              Wallet not loading? Switch to Method 2 (Approve Hash)
            </Button>
          </>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Method 2: Approve Hash (On-Chain)
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              This method works with any wallet. It sends a small on-chain transaction to approve the transaction hash,
              then broadcasts the actual transaction. Requires two transactions but avoids EIP-712 signing issues.
            </Typography>

            {approveHashError && <Alert severity="error" sx={{ mb: 2 }}>{approveHashError.message}</Alert>}
            {writeError && <Alert severity="error" sx={{ mb: 2 }}>{writeError.message}</Alert>}
            {approveHashTx && !approveHashConfirmed && (
              <Alert severity="info" sx={{ mb: 2 }}>Waiting for approveHash confirmation...</Alert>
            )}
            {approveHashConfirmed && (
              <Alert severity="success" sx={{ mb: 2 }}>Hash approved on-chain. Ready to broadcast.</Alert>
            )}
            {txHash && <Alert severity="info" sx={{ mb: 2 }}>Transaction Hash: {txHash}</Alert>}
            {isConfirming && <Alert severity="info" sx={{ mb: 2 }}>Waiting for transaction confirmation...</Alert>}
            {isConfirmed && <Alert severity="success" sx={{ mb: 2 }}>Transaction confirmed on-chain!</Alert>}

            <Stack direction="row" spacing={2} mt={2}>
              {!approveHashDone && !isConfirmed && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleApproveHash}
                  disabled={isApprovingHash || !isConnected || !domainSeparator || !safeTxHash || !!safeError}
                >
                  {isApprovingHash ? "Approving..." : "Step 1: Approve Hash"}
                </Button>
              )}
              {approveHashDone && !isConfirmed && !writeError && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={broadcastWithApprovedHash}
                  disabled={isWriting || isConfirming || !isConnected}
                >
                  {isWriting || isConfirming ? "Broadcasting..." : "Step 2: Broadcast Transaction"}
                </Button>
              )}
              {writeError && (
                <Button variant="contained" color="secondary" onClick={onClose}>
                  Close
                </Button>
              )}
            </Stack>

            <Divider sx={{ my: 2 }} />
            <Button variant="text" size="small" onClick={() => setUseApproveHash(false)}>
              Back to Method 1 (EIP-712 Signature)
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
