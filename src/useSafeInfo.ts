import { useEffect, useState } from "react";
import { useBalance, useReadContract, useWatchContractEvent } from "wagmi";
import { parseAbi, type Address, type PublicClient } from "viem";

const SAFE_VERSION_ABI = parseAbi(["function VERSION() view returns (string)"]);

const HEX_ADDRESS = "0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39"; // HEX contract address (mainnet/PulseChain)

export function useSafeInfo(safeAddress: Address, publicClient: PublicClient | undefined) {
  const [owners, setOwners] = useState<`0x${string}`[]>([]);
  const [threshold, setThreshold] = useState<number>(0);
  const [balance, setBalance] = useState<bigint | undefined>(undefined);
  const [hexBalance, setHexBalance] = useState<bigint | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isNotSafeContract, setIsNotSafeContract] = useState<boolean>(false);
  const [safeVersion, setSafeVersion] = useState<string | null>(null);

  // Fetch Safe version
  const { data: versionData } = useReadContract({
    address: safeAddress,
    abi: SAFE_VERSION_ABI,
    functionName: "VERSION",
    query: { enabled: !!safeAddress && !!publicClient },
  });

  // Fetch Safe owners
  const { data: ownersData, isFetching: isOwnersFetching, status: ownersStatus, error: ownersError } = useReadContract({
    address: safeAddress,
    abi: parseAbi(["function getOwners() view returns (address[])"]),
    functionName: "getOwners",
    query: { enabled: !!safeAddress && !!publicClient },
  });

  // Fetch Safe threshold
  const { data: thresholdData, isFetching: isThresholdFetching, status: thresholdStatus, error: thresholdError } = useReadContract({
    address: safeAddress,
    abi: parseAbi(["function getThreshold() view returns (uint256)"]),
    functionName: "getThreshold",
    query: { enabled: !!safeAddress && !!publicClient },
  });

  // Fetch native balance (PLS/ETH)
  const { data: balanceData, isLoading: isNativeBalanceLoadingRaw, status: balanceStatus, error: balanceError } = useBalance({
    address: safeAddress,
    query: {
      refetchInterval: 4_000, // Poll every 4 seconds
      refetchIntervalInBackground: true, // Continue polling in background
    },
  });

  // Fetch HEX balance
  const { data: hexBalanceData, isFetching: isHexBalanceFetching, refetch: refetchHexBalance, status: hexBalanceStatus, error: hexBalanceError } = useReadContract({
    address: HEX_ADDRESS as `0x${string}`,
    abi: parseAbi(["function balanceOf(address) view returns (uint256)"]),
    functionName: "balanceOf",
    args: [safeAddress],
    query: { enabled: !!safeAddress && !!publicClient },
  });

  // Compute loading states
  const isSafeLoading =
    !!safeAddress &&
    !!publicClient &&
    (isOwnersFetching || isThresholdFetching || ownersStatus === "pending");
  const isNativeBalanceLoading =
    !!safeAddress &&
    !!publicClient &&
    (isNativeBalanceLoadingRaw || balanceStatus === "pending");
  const isHexBalanceLoading =
    !!safeAddress &&
    !!publicClient &&
    (isHexBalanceFetching || hexBalanceStatus === "pending");

  // Reset state on safeAddress change
  useEffect(() => {
    setError(null);
    setIsNotSafeContract(false);
    setOwners([]);
    setThreshold(0);
    setBalance(undefined);
    setHexBalance(undefined);
    setSafeVersion(null);
  }, [safeAddress]);

  // Update balance and hexBalance
  useEffect(() => {
    if (balanceData?.value !== undefined) {
      setBalance(balanceData.value);
    }
    if (hexBalanceData !== undefined) {
      setHexBalance(hexBalanceData);
    }
  }, [balanceData, hexBalanceData]);

  // Check if address is a Safe contract
  useEffect(() => {
    if (!safeAddress || !publicClient) {
      setIsNotSafeContract(false);
      return;
    }

    const checkContract = async () => {
      try {
        const bytecode = await publicClient.getCode({ address: safeAddress });
        if (!bytecode || bytecode === "0x") {
          setIsNotSafeContract(true);
          setError("Address is not a contract");
          return;
        }

        if (ownersStatus === "error" && ownersError && !isSafeLoading) {
          setIsNotSafeContract(true);
          setError("Address is not a Safe contract");
        } else if (ownersData !== undefined) {
          setIsNotSafeContract(false);
          setError(null);
        }
      } catch (err) {
        setIsNotSafeContract(true);
        setError(`Failed to check contract code: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    };

    void checkContract();
  }, [safeAddress, publicClient, ownersStatus, ownersError, ownersData, isSafeLoading]);

  // Handle fetch errors
  useEffect(() => {
    if (isSafeLoading || isNativeBalanceLoading || isHexBalanceLoading) {
      setError(null);
      return;
    }

    if (!safeAddress || !publicClient) {
      setError("Invalid Safe address or no public client");
      return;
    }

    if (isNotSafeContract) {
      setError("Address is not a Safe contract");
      return;
    }

    if (balanceData !== undefined && hexBalanceData !== undefined && ownersData !== undefined && thresholdData !== undefined) {
      setError(null);
    } else {
      if (balanceStatus === "error" && balanceError) {
        setError(`Failed to fetch native balance: ${balanceError.message}`);
      } else if (hexBalanceStatus === "error" && hexBalanceError) {
        setError(`Failed to fetch HEX balance: ${hexBalanceError.message}`);
      } else if (thresholdStatus === "error" && thresholdError) {
        setError("Address is not a Safe contract");
      }
    }
  }, [
    safeAddress,
    publicClient,
    balanceData,
    hexBalanceData,
    ownersData,
    thresholdData,
    balanceStatus,
    balanceError,
    hexBalanceStatus,
    hexBalanceError,
    thresholdStatus,
    thresholdError,
    isSafeLoading,
    isNativeBalanceLoading,
    isHexBalanceLoading,
    isNotSafeContract,
  ]);

  // Subscribe to HEX Transfer events (both from and to Safe)
  useWatchContractEvent({
    address: HEX_ADDRESS as `0x${string}`,
    abi: parseAbi(["event Transfer(address indexed from, address indexed to, uint256 value)"]),
    eventName: "Transfer",
    onLogs: (logs) => {
      const relevantLogs = logs.filter(
        (log) =>
          log.args.from?.toLowerCase() === safeAddress.toLowerCase() ||
          log.args.to?.toLowerCase() === safeAddress.toLowerCase()
      );
      if (relevantLogs.length > 0) {
        void refetchHexBalance();
      }
    },
  });

  // Update owners, threshold, and version
  useEffect(() => {
    if (ownersData) {
      setOwners(ownersData as `0x${string}`[]);
    }
    if (thresholdData) {
      setThreshold(Number(thresholdData));
    }
    if (versionData) {
      setSafeVersion(versionData);
    }
  }, [ownersData, thresholdData, versionData]);

  return {
    owners,
    threshold,
    balance,
    hexBalance,
    error,
    isSafeLoading,
    isNativeBalanceLoading,
    isHexBalanceLoading,
    isNotSafeContract,
    safeVersion,
  };
}