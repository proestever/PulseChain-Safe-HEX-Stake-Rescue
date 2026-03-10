import {
  CircularProgress,
  Stack,
  Alert,
  Typography,
  Grid,
  Box,
} from "@mui/material";
import { formatEther, formatUnits } from "viem";
import { Fragment, useEffect } from "react";
import { useChainId } from "wagmi";

const BASE = import.meta.env.BASE_URL;

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
  const nativeCoinSymbol = chainId === 369 ? "PLS" : chainId === 1 ? "ETH" : "Native";
  const nativeLogo = chainId === 369 ? `${BASE}pulsechain-logo.svg` : `${BASE}ethereum-logo.svg`;

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

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, sm: 7 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
            Owner{owners.length > 1 ? "s" : ""}
            {!isSafeLoading && !isNotSafeContract && threshold > 1 && (
              <Typography component="span" variant="subtitle2" color="text.secondary" sx={{ ml: 1 }}>
                ({threshold} of {owners.length} required)
              </Typography>
            )}
          </Typography>
          <Typography sx={{ wordBreak: "break-word", fontFamily: "monospace", fontSize: "0.8em", lineHeight: 1.8 }}>
            {isSafeLoading
              ? "Loading..."
              : isNotSafeContract
              ? "Not a Safe contract address"
              : owners.length
              ? owners.map((addr) => (
                  <Fragment key={addr}>
                    {addr}<br />
                  </Fragment>
                ))
              : "No owners found"}
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 5 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
            Balances
          </Typography>
          <Stack spacing={1.5}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={1}>
                <img src={nativeLogo} alt={nativeCoinSymbol} width={22} height={22} style={{ borderRadius: '50%' }} />
                <Typography fontWeight={600}>{nativeCoinSymbol}</Typography>
              </Box>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.9em" }}>
                {isNativeBalanceLoading
                  ? "..."
                  : balance !== undefined
                  ? Number(formatEther(balance)).toLocaleString(undefined, { maximumFractionDigits: 4 })
                  : "—"}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={1}>
                <img src={`${BASE}hex-logo.svg`} alt="HEX" height={22} style={{ objectFit: 'contain' }} />
                <Typography fontWeight={600}>HEX</Typography>
              </Box>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.9em" }}>
                {isHexBalanceLoading
                  ? "..."
                  : hexBalance !== undefined
                  ? Number(formatUnits(hexBalance, 8)).toLocaleString(undefined, { maximumFractionDigits: 4 })
                  : "0.0000"}
              </Typography>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
