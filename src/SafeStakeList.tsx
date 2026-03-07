import { useEffect, useState } from "react";
import { usePublicClient, useReadContracts } from "wagmi";
import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from "@mui/material";
import { parseAbi, encodeFunctionData, zeroAddress, type PublicClient, formatUnits } from "viem";
import { HEX_ADDRESS } from "./constants";

const HEX_ABI = parseAbi([
  "function stakeCount(address stakerAddr) view returns (uint256)",
  "function stakeLists(address stakerAddr, uint256 stakeIndex) view returns (uint40 stakeId, uint72 stakedHearts, uint72 stakeShares, uint16 lockedDay, uint16 stakedDays, uint16 unlockedDay, bool isAutoStake)",
  "function currentDay() view returns (uint256)",
]);

interface Stake {
  contractIndex: number;
  stakeId: bigint;
  stakedHearts: bigint;
  stakeShares: bigint;
  lockedDay: bigint;
  stakedDays: bigint;
  unlockedDay: bigint;
  isAutoStake: boolean;
}

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

interface UseSafeStakesResult {
  currentDay: bigint;
  stakes: Stake[];
  stakeCount: bigint;
  error: string | null;
  isLoading: boolean;
}

/**
 * Fetches and manages HEX stakes for a given Safe address.
 */
function useSafeStakes(
  safeAddress: `0x${string}`,
  hexAddress: `0x${string}`,
  publicClient: PublicClient | undefined
): UseSafeStakesResult {
  const [stakes, setStakes] = useState<Stake[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    data: stakeCountData,
    error: countError,
    isLoading: countLoading,
  } = useReadContracts({
    contracts: [
      {
        address: hexAddress,
        abi: HEX_ABI,
        functionName: "stakeCount",
        args: [safeAddress],
      },
      {
        address: hexAddress,
        abi: HEX_ABI,
        functionName: "currentDay",
        args: [],
      },
    ],
    query: { enabled: !!publicClient && !!safeAddress },
  });

  const stakeCount = (stakeCountData?.[0].result as bigint) ?? 0n;
  const currentDay = (stakeCountData?.[1].result as bigint) ?? 0n;

  const stakeListContracts = Array.from({ length: Number(stakeCount) }, (_, index) => ({
    address: hexAddress,
    abi: HEX_ABI,
    functionName: "stakeLists",
    args: [safeAddress, BigInt(index)],
  }));

  const {
    data: stakeListData,
    error: listError,
    isLoading: listLoading,
  } = useReadContracts({
    contracts: stakeListContracts,
    query: { enabled: stakeCount > 0 && !!publicClient && !!safeAddress },
  });

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    if (countError) {
      setError(countError.message);
      setIsLoading(false);
      return;
    }

    if (listError) {
      setError(listError.message);
      setIsLoading(false);
      return;
    }

    if (stakeListData) {
      const formattedStakes = stakeListData
        .map((result, idx) => ({ result, idx }))
        .filter(({ result }) => result.status === "success")
        .map(({ result, idx }) => {
          const [stakeId, stakedHearts, stakeShares, lockedDay, stakedDays, unlockedDay, isAutoStake] =
            result.result as unknown as [bigint, bigint, bigint, number, number, number, boolean];
          return {
            contractIndex: idx,
            stakeId,
            stakedHearts,
            stakeShares,
            lockedDay: BigInt(lockedDay),
            stakedDays: BigInt(stakedDays),
            unlockedDay: BigInt(unlockedDay),
            isAutoStake,
          };
        });

      setStakes(formattedStakes);
      setIsLoading(false);
    }
  }, [stakeCount, stakeListData, countError, listError]);

  return { stakes, stakeCount, currentDay, error, isLoading: countLoading || listLoading || isLoading };
}

/**
 * Displays a list of HEX stakes for a Safe and allows ending them.
 */
export function SafeStakeList({
  appendLog,
  setSelectedTxData,
  nonce,
  safeAddress,
}: {
  appendLog: (log: string) => void;
  setSelectedTxData: (txData: SafeTxData) => void;
  nonce: string;
  safeAddress: `0x${string}`;
}) {
  const publicClient = usePublicClient();

  const { stakes, stakeCount, currentDay, error, isLoading } = useSafeStakes(safeAddress, HEX_ADDRESS, publicClient);

  const handleEndStake = (stakeIndex: number, stakeId: bigint) => {
    const txData: SafeTxData = {
      to: HEX_ADDRESS,
      value: "0",
      data: encodeFunctionData({
        abi: parseAbi(["function stakeEnd(uint256 stakeIndex, uint40 stakeIdParam)"]),
        args: [BigInt(stakeIndex), Number(stakeId)],
      }),
      operation: 0,
      safeTxGas: "6000000",
      baseGas: "0",
      gasPrice: "0",
      gasToken: zeroAddress,
      refundReceiver: zeroAddress,
      nonce,
    };
    setSelectedTxData(txData);
    appendLog(`Selected stakeEnd transaction for stakeIndex: ${stakeIndex}, stakeId: ${stakeId}`);
  };

  useEffect(() => {
    if (error) {
      appendLog(`Error fetching stakes: ${error}`);
    }
    if (stakes.length > 0) {
      appendLog(`Fetched ${stakes.length} stakes for Safe ${safeAddress}`);
    }
  }, [error, stakes, appendLog, safeAddress]);

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Safe HEX Stakes — HEX Current Day {currentDay + 1n}
      </Typography>
      <Card variant="outlined">
        <CardContent>
          {isLoading && <CircularProgress size={20} />}
          {error && <Alert severity="error">{error}</Alert>}
          {stakeCount === 0n && !isLoading && !error && (
            <Typography variant="body2" color="text.secondary">
              No stakes found for this Safe.
            </Typography>
          )}
          {stakes.length > 0 && (
            <Table size="small" sx={{ "& .MuiTableCell-root": { py: 0.5 } }}>
              <TableHead sx={{ "& .MuiTableCell-head": { fontWeight: "bold" } }}>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Staked HEX</TableCell>
                  <TableCell>TShares</TableCell>
                  <TableCell>Locked Day</TableCell>
                  <TableCell>Staked Days</TableCell>
                  <TableCell>End Day</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stakes
                  .sort((a, b) => {
                    const endA = a.lockedDay + a.stakedDays;
                    const endB = b.lockedDay + b.stakedDays;
                    return endA < endB ? -1 : endA > endB ? 1 : 0;
                  })
                  .map((stake) => {
                    const isStakeTermDone = stake.lockedDay + stake.stakedDays + 1n <= currentDay;
                    return (
                      <TableRow key={stake.stakeId}>
                        <TableCell>{stake.stakeId.toString()}</TableCell>
                        <TableCell>{formatUnits(stake.stakedHearts, 8)}</TableCell>
                        <TableCell>{Number(formatUnits(stake.stakeShares, 12)).toFixed(4)}</TableCell>
                        <TableCell>{stake.lockedDay.toString()}</TableCell>
                        <TableCell>{stake.stakedDays.toString()}</TableCell>
                        <TableCell>{(stake.lockedDay + stake.stakedDays + 1n).toString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleEndStake(stake.contractIndex, stake.stakeId)}
                            aria-label={`End stake with ID ${stake.stakeId}`}
                            sx={{
                              backgroundColor: isStakeTermDone ? "success.light" : "warning.main",
                              color: isStakeTermDone ? "primary.contrastText" : "warning.contrastText",
                              "&:hover": {
                                backgroundColor: isStakeTermDone ? "success.dark" : "warning.dark",
                              },
                              fontWeight: !isStakeTermDone ? "bold" : "normal",
                              border: !isStakeTermDone ? "1px solid" : "none",
                              borderColor: !isStakeTermDone ? "error.main" : "transparent",
                            }}
                          >
                            {isStakeTermDone ? "END" : "EES"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );})}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
