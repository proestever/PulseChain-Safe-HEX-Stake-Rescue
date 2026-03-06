import { SafeInfo } from "./SafeInfo";
import { SafeStakeList } from "./SafeStakeList";
import { HexTransferForm } from "./HexTransferForm";
import { NativeTransferForm } from "./NativeTransferForm";
import { TransactionSigner } from "./TransactionSigner";
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Card,
  CardContent,
  Collapse,
  IconButton,
  Autocomplete,
  TextField,
  Dialog,
  DialogContent,
  CircularProgress,
  Alert,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useChainId, useReadContract, usePublicClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseAbi, isAddress } from "viem";
import { useSafeInfo } from "./useSafeInfo";
import { useQueryClient } from "@tanstack/react-query";
import About from "./About";

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

// Type guard to validate parsed JSON as an array of valid addresses
function isValidAddressArray(data: unknown): data is `0x${string}`[] {
  return Array.isArray(data) && data.every((item) => typeof item === "string" && isAddress(item));
}

function App() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [selectedTxData, setSelectedTxData] = useState<SafeTxData | null>(null);
  const [txStatus, setTxStatus] = useState<{ isBroadcast: boolean; isConfirmed: boolean }>({
    isBroadcast: false,
    isConfirmed: false,
  });
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const prevChainIdRef = useRef(chainId);
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const [safeAddress, setSafeAddress] = useState<`0x${string}` | "">(() => {
    const stored = localStorage.getItem("safeAddresses");
    const addresses =
      stored && ((isValidAddressArray(JSON.parse(stored)) ? JSON.parse(stored) : []) as `0x${string}`[]);
    return (addresses && addresses.length > 0 ? addresses[0] : "") as `0x${string}`;
  });
  const [inputAddress, setInputAddress] = useState<`0x${string}` | "">(safeAddress);
  const [safeAddresses, setSafeAddresses] = useState<`0x${string}`[]>(() => {
    const stored = localStorage.getItem("safeAddresses");
    return (stored && isValidAddressArray(JSON.parse(stored)) ? JSON.parse(stored) : []) as `0x${string}`[];
  });

  const {
    owners,
    threshold,
    balance,
    hexBalance,
    error: safeError,
    isSafeLoading,
    isNativeBalanceLoading,
    isHexBalanceLoading,
    isNotSafeContract,
  } = useSafeInfo(safeAddress as `0x${string}`, publicClient);

  const appendLog = useCallback((log: string) => {
    const timestamp = new Date().toISOString();
    setLogs((prev) => [...prev, `${timestamp}: ${log}`]);
  }, []);

  useEffect(() => {
    if (safeAddress) {
      if (!safeAddresses.includes(safeAddress)) {
        const updatedAddresses = [safeAddress, ...safeAddresses].slice(0, 10); // Limit to 10 addresses
        setSafeAddresses(updatedAddresses);
        localStorage.setItem("safeAddresses", JSON.stringify(updatedAddresses));
      }
      appendLog(`Safe address set to: ${safeAddress}`);
    } else {
      localStorage.setItem("safeAddresses", JSON.stringify(safeAddresses));
      appendLog("Safe address cleared");
    }
  }, [safeAddress, appendLog, safeAddresses]);

  useEffect(() => {
    if (isConnected) {
      appendLog(`Wallet connected: ${address} on chain ${chain?.name} (ID: ${chainId})`);
    } else {
      appendLog("Wallet disconnected or not detected");
    }
  }, [isConnected, address, chain, chainId, appendLog]);

  useEffect(() => {
    if (prevChainIdRef.current !== chainId && chainId !== undefined) {
      appendLog(`Chain changed to ${chain?.name} (ID: ${chainId}) via wallet`);
      prevChainIdRef.current = chainId;
    }
  }, [chainId, chain, appendLog]);

  useEffect(() => {
    if (safeError) {
      appendLog(`Safe info error: ${safeError}`);
    }
  }, [safeError, appendLog]);

  const safeAbi = parseAbi(["function nonce() view returns (uint256)"]);
  const { data: nonceBigInt, error: nonceError } = useReadContract({
    address: safeAddress as `0x${string}`,
    abi: safeAbi,
    functionName: "nonce",
    query: { enabled: isConnected && isAddress(safeAddress) },
  });
  const nonce = nonceError ? null : nonceBigInt?.toString() ?? "0";

  useEffect(() => {
    if (nonceError) {
      appendLog(`Nonce fetch error: ${nonceError.message}`);
    } else if (nonce !== null && nonce !== "0") {
      appendLog(`Fetched Safe nonce: ${nonce}`);
    }
  }, [nonce, nonceError, appendLog]);

  const handleCloseTransaction = useCallback(() => {
    setSelectedTxData(null);
    setTxStatus({ isBroadcast: false, isConfirmed: false });
    appendLog("Closed transaction");
  }, [appendLog]);

  const handleTransactionStatusChange = useCallback(
    (status: { isBroadcast: boolean; isConfirmed: boolean }) => {
      setTxStatus((prev) => {
        const newStatus = { ...prev, ...status };
        appendLog(
          `Transaction status updated: isBroadcast=${newStatus.isBroadcast}, isConfirmed=${newStatus.isConfirmed}`
        );
        return newStatus;
      });
    },
    [appendLog]
  );

  const handleTransactionConfirmed = useCallback(() => {
    appendLog("Transaction confirmed, invalidating Safe balance queries");
    void queryClient.invalidateQueries({ queryKey: ["safeInfo", safeAddress] });
  }, [queryClient, safeAddress, appendLog]);

  const handleClearLogs = useCallback(() => {
    setLogs([]);
    appendLog("Debug logs cleared");
  }, [appendLog]);

  const commitSafeAddress = useCallback(
    (value: `0x${string}` | "") => {
      setInputAddress(value);
      if (value === "" || isAddress(value)) {
        setSafeAddress(value);
      } else {
        appendLog("Invalid Safe address format");
      }
    },
    [appendLog]
  );

  useEffect(() => {
    if (selectedTxData) {
      appendLog(
        `Selected transaction data set: to=${selectedTxData.to}, value=${selectedTxData.value}, data=${selectedTxData.data}`
      );
    }
  }, [selectedTxData, appendLog]);

  return (
    <Box minHeight="100vh" bgcolor="background.default">
      <AppBar position="fixed" color="default" elevation={2}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight="bold">
            PulseChain Safe HEX Stake Rescue
          </Typography>
          <ConnectButton.Custom>
            {({ account, chain, openConnectModal, openChainModal, mounted }) => {
              if (!mounted) return null;
              if (!account) {
                return (
                  <Button variant="contained" onClick={openConnectModal}>
                    Connect Wallet
                  </Button>
                );
              }
              return (
                <Box display="flex" gap={1}>
                  <Button variant="outlined" onClick={openChainModal}>
                    {chain?.name || "Unknown Chain"}
                  </Button>
                  <Button variant="contained" onClick={openConnectModal}>
                    {account.displayName}
                  </Button>
                </Box>
              );
            }}
          </ConnectButton.Custom>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ pt: 12, pb: 4 }}>
        {isConnected && (
          <Alert
            severity={chainId === 369 ? "success" : chainId === 1 ? "info" : "warning"}
            sx={{ mt: 2, mb: 1 }}
          >
            {chainId === 369
              ? "Connected to PulseChain — ready to rescue stakes"
              : chainId === 1
              ? "Connected to Ethereum — switch to PulseChain if you need PLS stakes"
              : `Connected to chain ${chainId} — switch to PulseChain (369) or Ethereum (1)`}
          </Alert>
        )}
        <Card elevation={3} sx={{ mt: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Autocomplete
                options={safeAddresses}
                value={inputAddress}
                onChange={(_, value) => commitSafeAddress((value ?? "") as `0x${string}`)}
                onInputChange={(_, value) => setInputAddress(value as `0x${string}` | "")}
                onBlur={(event: React.FocusEvent<HTMLInputElement>) =>
                  commitSafeAddress(event.target.value as `0x${string}` | "")
                }
                freeSolo
                fullWidth
                filterOptions={(options) => options}
                renderOption={(props, option) => (
                  <li {...props} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{option}</span>
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation(); // Prevent Autocomplete selection
                        const updatedAddresses = safeAddresses.filter((addr) => addr !== option);
                        setSafeAddresses(updatedAddresses);
                        localStorage.setItem("safeAddresses", JSON.stringify(updatedAddresses));
                        appendLog(`Removed address from list: ${option}`);
                      }}
                      aria-label={`Remove address ${option}`}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Safe Address"
                    variant="outlined"
                    size="small"
                    error={!!inputAddress && !isAddress(inputAddress)}
                    helperText={!!inputAddress && !isAddress(inputAddress) ? "Invalid address format" : ""}
                    sx={{ input: { fontFamily: "monospace" } }}
                    onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                      if (event.key === "Enter") {
                        commitSafeAddress(inputAddress);
                        (event.target as HTMLInputElement).blur(); // Close the dropdown
                      }
                    }}
                  />
                )}
              />
              <Button
                variant="contained"
                size="small"
                onClick={() => commitSafeAddress(inputAddress)}
                disabled={!isAddress(inputAddress)}
                aria-label="Confirm Safe Address"
              >
                Go
              </Button>
            </Box>
          </CardContent>
        </Card>

        {isAddress(safeAddress) && (
          <>
            {isSafeLoading ? (
              <Card elevation={3} sx={{ mt: 4 }}>
                <CardContent>
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight={100}>
                    <CircularProgress size={30} />
                    <Typography variant="body1" sx={{ ml: 2 }}>
                      Loading Safe information...
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ) : nonce !== null ? (
              <>
                <Card elevation={3} sx={{ mt: 4 }}>
                  <CardContent>
                    <SafeInfo
                      appendLog={appendLog}
                      owners={owners}
                      threshold={threshold}
                      balance={balance}
                      hexBalance={hexBalance}
                      error={safeError}
                      isSafeLoading={isSafeLoading}
                      isNativeBalanceLoading={isNativeBalanceLoading}
                      isHexBalanceLoading={isHexBalanceLoading}
                      isNotSafeContract={isNotSafeContract}
                    />
                  </CardContent>
                </Card>
                {typeof hexBalance === "bigint" && hexBalance > 0n && (
                  <Card elevation={3} sx={{ mt: 4 }}>
                    <CardContent>
                      <HexTransferForm
                        appendLog={appendLog}
                        setSelectedTxData={setSelectedTxData}
                        hexBalance={hexBalance}
                        nonce={nonce}
                        safeAddress={safeAddress}
                      />
                    </CardContent>
                  </Card>
                )}
                {typeof balance === "bigint" && balance > 0n && (
                  <Card elevation={3} sx={{ mt: 4 }}>
                    <CardContent>
                      <NativeTransferForm
                        appendLog={appendLog}
                        setSelectedTxData={setSelectedTxData}
                        balance={balance}
                        nonce={nonce}
                        safeAddress={safeAddress}
                        chainId={chainId}
                      />
                    </CardContent>
                  </Card>
                )}
                <Card elevation={3} sx={{ mt: 4 }}>
                  <CardContent>
                    <SafeStakeList
                      appendLog={appendLog}
                      setSelectedTxData={setSelectedTxData}
                      nonce={nonce}
                      safeAddress={safeAddress}
                    />
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card elevation={3} sx={{ mt: 4 }}>
                <CardContent>
                  <Typography color="error">Failed to fetch Safe nonce. Please check the Safe address.</Typography>
                </CardContent>
              </Card>
            )}
          </>
        )}
        <Dialog
          open={!!selectedTxData}
          onClose={handleCloseTransaction}
          maxWidth="md"
          fullWidth
          sx={{ "& .MuiDialog-paper": { bgcolor: "background.default" } }}
        >
          <DialogContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Sign Transaction</Typography>
              <Button variant="outlined" color="error" onClick={handleCloseTransaction}>
                {txStatus.isBroadcast || txStatus.isConfirmed ? "Close" : "Cancel"}
              </Button>
            </Box>
            {selectedTxData && (
              <TransactionSigner
                appendLog={appendLog}
                txData={selectedTxData}
                safeAddress={safeAddress as `0x${string}`}
                onClose={handleCloseTransaction}
                onStatusChange={handleTransactionStatusChange}
                onTransactionConfirmed={handleTransactionConfirmed}
              />
            )}
          </DialogContent>
        </Dialog>
        <About />
        <Card elevation={3} sx={{ mt: 4 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" px={2} py={1}>
            <Typography variant="subtitle1" fontWeight="medium">
              Debug Log
            </Typography>
            <IconButton onClick={() => setIsLogOpen(!isLogOpen)}>
              <ExpandMoreIcon
                sx={{
                  transform: isLogOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </IconButton>
          </Box>
          <Collapse in={isLogOpen} timeout="auto" unmountOnExit>
            <Box px={2} pb={2}>
              <Button variant="outlined" onClick={handleClearLogs} sx={{ mb: 1 }}>
                Clear Logs
              </Button>
              <TextField
                multiline
                minRows={10}
                fullWidth
                value={logs.join("\n")}
                slotProps={{
                  input: {
                    readOnly: true,
                    style: { fontFamily: "monospace", fontSize: 12 },
                    ref: (input: HTMLTextAreaElement) => input?.scrollTo(0, input.scrollHeight),
                  },
                }}
              />
            </Box>
          </Collapse>
        </Card>
      </Container>
    </Box>
  );
}

export default App;
