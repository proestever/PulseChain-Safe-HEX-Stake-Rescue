import { useState, useCallback, useEffect } from "react";
import { Box, Typography, TextField, Button, Alert, InputAdornment, IconButton } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { isAddress, parseEther } from "viem";
import { useErrorHandler } from "./useErrorHandler.ts";
import { debounce } from "lodash";

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

interface NativeTransferFormProps {
  appendLog: (log: string) => void;
  setSelectedTxData: (txData: SafeTxData) => void;
  balance: bigint | undefined;
  nonce: string;
  safeAddress: `0x${string}`;
  chainId: number;
}

/**
 * Component for transferring native coins (e.g., ETH, PLS) from a Safe.
 */
export function NativeTransferForm({
  appendLog,
  setSelectedTxData,
  balance,
  nonce,
  safeAddress,
  chainId,
}: NativeTransferFormProps) {
  const [to, setTo] = useState(() => localStorage.getItem("nativeRecipientAddress") || "");
  const [amount, setAmount] = useState("");
  const { error, handleError, clearError } = useErrorHandler(appendLog);

  const nativeCoinSymbol = chainId === 369 ? "PLS" : chainId === 1 ? "ETH" : "Native Coin";

  useEffect(() => {
    if (to && isAddress(to)) {
      localStorage.setItem("nativeRecipientAddress", to);
      appendLog(`Cached native recipient address: ${to}`);
    } else if (!to) {
      localStorage.removeItem("nativeRecipientAddress");
      appendLog("Cleared native recipient address from localStorage");
    }
  }, [to, appendLog]);

  const handleClearRecipient = useCallback(() => {
    setTo("");
    localStorage.removeItem("nativeRecipientAddress");
    appendLog("Cleared native recipient address from input and localStorage");
    clearError();
  }, [appendLog, clearError]);

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTo(value);
    if (value && !isAddress(value)) {
      handleError("Invalid recipient address");
    } else {
      clearError();
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedHandleAmountChange = useCallback(
    debounce((value: string) => {
      try {
        const amountBigInt = parseEther(value);
        if (amountBigInt <= 0) {
          handleError("Amount must be greater than 0");
        } else if (balance !== undefined && amountBigInt > balance) {
          handleError(`Insufficient ${nativeCoinSymbol} balance`);
        } else {
          clearError();
        }
      } catch {
        handleError("Invalid amount format");
      }
    }, 300),
    [balance, nativeCoinSymbol, handleError, clearError]
  );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    debouncedHandleAmountChange(value);
  };

  const handleSubmit = useCallback(() => {
    if (!isAddress(to)) {
      handleError("Invalid recipient address");
      return;
    }

    let amountBigInt: bigint;
    try {
      amountBigInt = parseEther(amount);
      if (amountBigInt <= 0) {
        handleError("Amount must be greater than 0");
        return;
      }
      if (balance !== undefined && amountBigInt > balance) {
        handleError(`Insufficient ${nativeCoinSymbol} balance`);
        return;
      }
    } catch (err) {
      handleError(`Invalid amount format: ${err instanceof Error ? err.message : "Unknown error"}`);
      return;
    }

    const txData: SafeTxData = {
      to,
      value: amountBigInt.toString(),
      data: "0x",
      operation: 0,
      safeTxGas: "0",
      baseGas: "0",
      gasPrice: "0",
      gasToken: "0x0000000000000000000000000000000000000000",
      refundReceiver: "0x0000000000000000000000000000000000000000",
      nonce,
    };

    setSelectedTxData(txData);
    setAmount("");
  }, [to, amount, balance, nonce, setSelectedTxData, nativeCoinSymbol, handleError]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Send {nativeCoinSymbol}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Transfer {nativeCoinSymbol} from Safe {safeAddress.slice(0, 6)}...{safeAddress.slice(-4)}.
        {balance !== undefined && (
          <>
            {" "}
            Available: {(Number(balance) / 1e18).toFixed(4)} {nativeCoinSymbol}
          </>
        )}
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box display="flex" gap={2} alignItems="center">
        <TextField
          label="Recipient Address"
          value={to}
          onChange={handleToChange}
          fullWidth
          variant="outlined"
          size="small"
          error={!!error && to !== ""}
          helperText={error && to !== "" ? error : ""}
          slotProps={{
            input: {
              endAdornment: to && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleClearRecipient}
                    edge="end"
                    aria-label="Clear Recipient Address"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              sx: { fontFamily: "monospace" },
            },
          }}
        />
        <TextField
          label={`Amount (${nativeCoinSymbol})`}
          value={amount}
          onChange={handleAmountChange}
          type="number"
          fullWidth
          variant="outlined"
          size="small"
          error={!!error && amount !== ""}
          helperText={error && amount !== "" ? error : ""}
          slotProps={{
            input: {
              inputProps: { min: 0, step: "any" },
              endAdornment: <InputAdornment position="end">{nativeCoinSymbol}</InputAdornment>,
              sx: { fontFamily: "monospace" },
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            !to ||
            !amount ||
            !isAddress(to) ||
            (balance !== undefined && parseEther(amount) > balance) ||
            parseFloat(amount) <= 0
          }
        >
          Send
        </Button>
      </Box>
    </Box>
  );
}
