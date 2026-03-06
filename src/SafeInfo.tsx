import {
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Stack,
  Alert,
  Typography,
  Grid,
} from "@mui/material";
import { formatEther, formatUnits } from "viem";
import { Fragment, useEffect } from "react";
import { useChainId } from "wagmi";

interface SafeInfoProps {
  appendLog: (log: string) => void;
  owners: `0x${string}`[];
  threshold: number;
  balance: bigint | undefined;
  hexBalance: bigint | undefined;
  error: string | null;
  isSafeLoading: boolean;
  isNativeBalanceLoading: boolean;
  isHexBalanceLoading: boolean;
  isNotSafeContract: boolean;
}

/**
 * Displays information about a Gnosis Safe, including owners, threshold, and balances.
 */
export function SafeInfo({
  appendLog,
  owners,
  threshold,
  balance,
  hexBalance,
  error: safeError,
  isSafeLoading,
  isNativeBalanceLoading,
  isHexBalanceLoading,
  isNotSafeContract,
}: SafeInfoProps) {
  const chainId = useChainId();
  const nativeCoinSymbol = chainId === 369 ? "PLS" : chainId === 1 ? "ETH" : "Native Coin";

  useEffect(() => {
    if (safeError) {
      appendLog(`Safe info error: ${safeError}`);
    }
  }, [safeError, appendLog]);

  return (
    <Stack spacing={3}>
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
        Safe Info
      </Typography>
      {isSafeLoading && <CircularProgress size={20} />}
      {safeError && !isSafeLoading && !isNativeBalanceLoading && !isHexBalanceLoading && (
        <Alert severity="error">{safeError}</Alert>
      )}
      <Card variant="outlined">
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 8, md: 7 }}>
              <List dense sx={{ py: 0.5 }}>
                <ListItem>
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: "bold" }}>Owner{owners.length > 1 ? "s" : ""}</Typography>}
                    secondary={
                      <Typography sx={{ wordBreak: "break-word", fontFamily: "monospace", fontSize: "0.8em" }}>
                        {isSafeLoading
                          ? "Loading..."
                          : isNotSafeContract
                          ? "Not a Safe contract address"
                          : owners.length
                          ? owners.map((addr) => (
                              <Fragment key={addr}>
                                {addr} <br />
                              </Fragment>
                            ))
                          : "No owners found"}
                        {!isSafeLoading && !isNotSafeContract && threshold > 1 && (
                          <Typography component="span" sx={{ fontWeight: "bold" }}>
                            {threshold} signature{threshold > 1 ? "s" : ""} required
                          </Typography>
                        )}
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 5 }}>
              <List dense sx={{ py: 0.5 }}>
                <ListItem>
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: "bold" }}>Balance ({nativeCoinSymbol})</Typography>}
                    secondary={
                      <Typography sx={{ fontFamily: "monospace", fontSize: "0.8em" }}>
                        {isNativeBalanceLoading
                          ? "Loading..."
                          : balance !== undefined
                          ? Number(formatEther(balance))
                          : "Failed to fetch"}
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: "bold" }}>HEX Balance</Typography>}
                    secondary={
                      <Typography sx={{ fontFamily: "monospace", fontSize: "0.8em" }}>
                        {isHexBalanceLoading
                          ? "Loading..."
                          : hexBalance !== undefined
                          ? Number(formatUnits(hexBalance, 8))
                          : "0.0000"}
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}
