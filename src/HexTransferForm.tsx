import { useState, useEffect, useCallback } from "react";
import { Box, Button, TextField, Typography, InputAdornment, IconButton, Alert } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { parseUnits, encodeFunctionData, zeroAddress, isAddress, parseAbi, formatUnits } from "viem";
import { HEX_ADDRESS } from "./constants";
import { useErrorHandler } from "./useErrorHandler";

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

export function HexTransferForm({
  appendLog,
  setSelectedTxData,
  hexBalance,
  nonce,
  safeAddress,
}: {
  appendLog: (log: string) => void;
  setSelectedTxData: (txData: SafeTxData) => void;
  hexBalance: bigint | undefined;
  nonce: string;
  safeAddress: `0x${string}`;
}) {
  const [amount, setAmount] = useState<string>("");
  const [toAddress, setToAddress] = useState<string>(() => {
    return localStorage.getItem("toAddress") || "";
  });
  const { error, handleError, clearError } = useErrorHandler(appendLog);

  useEffect(() => {
    if (hexBalance !== undefined && !amount) {
      const formattedBalance = formatUnits(hexBalance, 8);
      setAmount(formattedBalance);
      appendLog(`Set default HEX amount to ${formattedBalance} based on Safe balance`);
    } else if (hexBalance === undefined) {
      setAmount("");
      appendLog("HEX balance not available, setting amount to empty");
    }
  }, [hexBalance, amount, appendLog]);

  useEffect(() => {
    if (toAddress) {
      localStorage.setItem("toAddress", toAddress);
      appendLog(`Stored To address in localStorage: ${toAddress}`);
    } else {
      localStorage.removeItem("toAddress");
      appendLog("Cleared To address from localStorage");
    }
  }, [toAddress, appendLog]);

  const handleClearToAddress = () => {
    setToAddress("");
    localStorage.removeItem("toAddress");
    appendLog("Cleared To address from input and localStorage");
    clearError();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d{0,8}$/.test(value)) {
      setAmount(value);
      if (value && (isNaN(parseFloat(value)) || parseFloat(value) <= 0)) {
        handleError("Invalid HEX amount");
      } else if (value && hexBalance !== undefined && parseUnits(value, 8) > hexBalance) {
        handleError("HEX amount exceeds available balance");
      } else {
        clearError();
      }
    } else {
      handleError("Invalid HEX amount format: up to 8 decimal places allowed");
    }
  };

  const handleToAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToAddress(value);
    if (value && !isAddress(value)) {
      handleError("Invalid To address format");
    } else if (value && value.toLowerCase() === safeAddress.toLowerCase()) {
      handleError("Cannot transfer to the Safe's own address");
    } else if (value && value.toLowerCase() === zeroAddress.toLowerCase()) {
      handleError("Cannot transfer to the zero address");
    } else {
      clearError();
    }
  };

  const handleSend = useCallback(() => {
    if (!isAddress(toAddress)) {
      handleError("Cannot create transaction: Invalid To address");
      return;
    }
    if (toAddress.toLowerCase() === safeAddress.toLowerCase()) {
      handleError("Cannot create transaction: To address is the Safe's own address");
      return;
    }
    if (toAddress.toLowerCase() === zeroAddress.toLowerCase()) {
      handleError("Cannot create transaction: To address is the zero address");
      return;
    }
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      handleError("Cannot create transaction: Invalid HEX amount");
      return;
    }
    if (hexBalance === undefined) {
      handleError("Cannot create transaction: HEX balance not available");
      return;
    }
    const hexAmount = parseUnits(amount, 8);
    if (hexAmount > hexBalance) {
      handleError("Cannot create transaction: Amount exceeds HEX balance");
      return;
    }

    const txData: SafeTxData = {
      to: HEX_ADDRESS,
      value: "0",
      data: encodeFunctionData({
        abi: parseAbi(["function transfer(address to, uint256 value)"]),
        args: [toAddress, hexAmount],
      }),
      operation: 0,
      safeTxGas: "0",
      baseGas: "0",
      gasPrice: "0",
      gasToken: zeroAddress,
      refundReceiver: zeroAddress,
      nonce,
    };

    setSelectedTxData(txData);
  }, [amount, toAddress, hexBalance, nonce, safeAddress, setSelectedTxData, handleError]);

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Transfer HEX
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Transfer HEX from Safe {safeAddress.slice(0, 6)}...{safeAddress.slice(-4)}.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box display="flex" gap={2} alignItems="center">
        <TextField
          label="HEX Amount"
          value={amount}
          onChange={handleAmountChange}
          variant="outlined"
          size="small"
          type="number"
          error={!!error && amount !== ""}
          helperText={error && amount !== "" ? error : ""}
          slotProps={{
            input: {
              inputProps: { min: 0, step: "any" },
              sx: { fontFamily: "monospace" },
            },
          }}
        />

        <TextField
          label="To Address"
          value={toAddress}
          onChange={handleToAddressChange}
          variant="outlined"
          size="small"
          error={!!error && toAddress !== ""}
          helperText={error && toAddress !== "" ? error : ""}
          slotProps={{
            input: {
              endAdornment: toAddress && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearToAddress} edge="end" aria-label="Clear To Address">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              sx: { fontFamily: "monospace" },
            },
          }}
          fullWidth
        />

        <Button
          variant="contained"
          onClick={handleSend}
          disabled={
            !amount ||
            !toAddress ||
            !isAddress(toAddress) ||
            toAddress.toLowerCase() === safeAddress.toLowerCase() ||
            toAddress.toLowerCase() === zeroAddress.toLowerCase() ||
            isNaN(parseFloat(amount)) ||
            parseFloat(amount) <= 0 ||
            (hexBalance !== undefined && parseUnits(amount, 8) > hexBalance)
          }
        >
          SEND
        </Button>
      </Box>
    </>
  );
}
