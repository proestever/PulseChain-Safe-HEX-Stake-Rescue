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
  IconButton,
  Autocomplete,
  TextField,
  Dialog,
  DialogContent,
  CircularProgress,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import MenuIcon from "@mui/icons-material/Menu";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useChainId, useReadContract, usePublicClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseAbi, isAddress } from "viem";
import { useSafeInfo } from "./useSafeInfo";
import { useQueryClient } from "@tanstack/react-query";
import { useColorMode } from "./ThemeContext";
import About from "./About";
import HowToUse from "./HowToUse";

const BASE = import.meta.env.BASE_URL;

const ChainLogo = ({ chainId }: { chainId?: number }) => (
  <img
    src={chainId === 369 ? `${BASE}pulsechain-logo.svg` : `${BASE}ethereum-logo.svg`}
    alt={chainId === 369 ? "PulseChain" : "Ethereum"}
    width={20}
    height={20}
    style={{ borderRadius: '50%' }}
  />
);

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

function isValidAddressArray(data: unknown): data is `0x${string}`[] {
  return Array.isArray(data) && data.every((item) => typeof item === "string" && isAddress(item));
}

type Page = "app" | "about" | "how-to-use";

function App() {
  const { mode, toggle: toggleColorMode } = useColorMode();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState<Page>("app");
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
    console.log(`[SafeRescue] ${timestamp}: ${log}`);
  }, []);

  useEffect(() => {
    if (safeAddress) {
      if (!safeAddresses.includes(safeAddress)) {
        const updatedAddresses = [safeAddress, ...safeAddresses].slice(0, 10);
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
    <Box minHeight="100vh">
      <AppBar position="fixed" elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between", gap: 1, px: { xs: 3, sm: 4 } }}>
          {/* Logo + Title — always visible */}
          <Box display="flex" alignItems="center" gap={1} sx={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setPage("app")}>
            <img src={`${BASE}safe-logo.png`} alt="Safe" height={32} style={{ objectFit: 'contain' }} />
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ color: mode === 'dark' ? '#ffffff' : '#1a1a2e', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' } }}
            >
              SAFE STAKE RESCUE
            </Typography>
          </Box>

          {/* Desktop nav */}
          {!isMobile && (
            <>
              <Box display="flex" alignItems="center" gap={1}>
                <Button
                  variant={page === "how-to-use" ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setPage(page === "how-to-use" ? "app" : "how-to-use")}
                  sx={{ minWidth: 'auto', px: 2, fontSize: '0.8rem' }}
                >
                  How to Use
                </Button>
                <Button
                  variant={page === "about" ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setPage(page === "about" ? "app" : "about")}
                  sx={{ minWidth: 'auto', px: 2, fontSize: '0.8rem' }}
                >
                  About
                </Button>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <IconButton onClick={toggleColorMode} size="small" sx={{ color: 'inherit' }}>
                  {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                </IconButton>
                <ConnectButton.Custom>
                  {({ account, chain: connectedChain, openConnectModal, openChainModal, mounted }) => {
                    if (!mounted) return null;
                    if (!account) {
                      return (
                        <Button variant="contained" onClick={openConnectModal}>
                          Connect Wallet
                        </Button>
                      );
                    }
                    return (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Button
                          variant="outlined"
                          onClick={openChainModal}
                          startIcon={<ChainLogo chainId={connectedChain?.id} />}
                          sx={{ fontSize: '0.85rem' }}
                        >
                          {connectedChain?.name || "Unknown"}
                        </Button>
                        <Button variant="contained" onClick={openConnectModal} sx={{ fontSize: '0.85rem' }}>
                          {account.displayName}
                        </Button>
                      </Box>
                    );
                  }}
                </ConnectButton.Custom>
              </Box>
            </>
          )}

          {/* Mobile: wallet + hamburger */}
          {isMobile && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <ConnectButton.Custom>
                {({ account, chain: connectedChain, openConnectModal, openChainModal, mounted }) => {
                  if (!mounted) return null;
                  if (!account) {
                    return (
                      <Button variant="contained" size="small" onClick={openConnectModal}>
                        Connect
                      </Button>
                    );
                  }
                  return (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <IconButton onClick={openChainModal} size="small" sx={{ color: 'inherit' }}>
                        <ChainLogo chainId={connectedChain?.id} />
                      </IconButton>
                      <Button variant="contained" size="small" onClick={openConnectModal} sx={{ fontSize: '0.75rem', px: 1.5 }}>
                        {account.displayName}
                      </Button>
                    </Box>
                  );
                }}
              </ConnectButton.Custom>
              <IconButton
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                size="small"
                sx={{ color: 'inherit' }}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={!!menuAnchor}
                onClose={() => setMenuAnchor(null)}
                slotProps={{
                  paper: {
                    sx: {
                      minWidth: 180,
                      bgcolor: mode === 'dark' ? '#0a0a0f' : '#f0f1f3',
                      backdropFilter: 'blur(20px)',
                      border: mode === 'dark' ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.06)',
                      borderRadius: '12px',
                      mt: 1,
                    },
                  },
                }}
              >
                <MenuItem onClick={() => { setPage("app"); setMenuAnchor(null); }}>
                  Home
                </MenuItem>
                <MenuItem onClick={() => { setPage("how-to-use"); setMenuAnchor(null); }}>
                  How to Use
                </MenuItem>
                <MenuItem onClick={() => { setPage("about"); setMenuAnchor(null); }}>
                  About
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { toggleColorMode(); setMenuAnchor(null); }}>
                  {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{
        pt: 12, pb: 4, px: { xs: 3, sm: 4 },
        ...(page !== "about" && page !== "how-to-use" && !isAddress(safeAddress) ? {
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        } : {})
      }}>
        {page === "about" ? (
          <About />
        ) : page === "how-to-use" ? (
          <HowToUse />
        ) : (
          <>
            <Card sx={{ mt: isAddress(safeAddress) ? 2 : 0 }}>
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
                            event.stopPropagation();
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
                            (event.target as HTMLInputElement).blur();
                          }
                        }}
                      />
                    )}
                  />
                  <Button
                    variant="contained"
                    onClick={() => commitSafeAddress(inputAddress)}
                    disabled={!isAddress(inputAddress)}
                    aria-label="Confirm Safe Address"
                    sx={{ height: 40, minWidth: 48 }}
                  >
                    Go
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {isAddress(safeAddress) && (
              <>
                {isSafeLoading ? (
                  <Card sx={{ mt: 4 }}>
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
                    <Card sx={{ mt: 4 }}>
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
                      <Card sx={{ mt: 4 }}>
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
                      <Card sx={{ mt: 4 }}>
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
                    <Card sx={{ mt: 4 }}>
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
                  <Card sx={{ mt: 4 }}>
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
          </>
        )}
      </Container>
    </Box>
  );
}

export default App;
