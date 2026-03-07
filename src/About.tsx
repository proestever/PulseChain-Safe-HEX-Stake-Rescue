import { Card, CardContent, Typography, Box, Link } from "@mui/material";

const About = () => {
  return (
    <Card elevation={3} sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold">
          About
        </Typography>
        <Box>
          This dApp helps PulseChain and Ethereum users end HEX stakes locked in Safe (formerly Gnosis Safe) smart
          contract wallets, including those created by the now-defunct StakerApp.
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" fontWeight="bold">
            How to Use
          </Typography>
          <ol style={{ margin: "8px 0", paddingLeft: "20px" }}>
            <li>Connect your wallet (the Safe owner/signer account)</li>
            <li>Enter your Safe contract address</li>
            <li>Select a stake to end</li>
            <li>Use <strong>Method 2 (Approve Hash)</strong> — works with any wallet</li>
            <li>Step 1: Approve the transaction hash on-chain</li>
            <li>Step 2: Broadcast the transaction to end the stake</li>
          </ol>
          For StakerApp users: import your StakerApp signing wallet (first account from your seed phrase) into{" "}
          <Link href="https://metamask.io/">MetaMask</Link> or Rabby, then enter your internal Safe address.
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" fontWeight="bold">
            Credits
          </Typography>
          Originally built by{" "}
          <Link href="https://github.com/gruvin/safe_stake_rescue" target="_blank" rel="noopener noreferrer">
            @FutureUs (gruvin)
          </Link>{" "}
          for Ethereum. This fork adds PulseChain support and fixes several critical issues:
          <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
            <li>
              <strong>Safe v1.1.1 support</strong> — StakerApp uses Safe v1.1.1 which has a different EIP-712 domain
              separator (no chainId). The original app only supported v1.3.0+.
            </li>
            <li>
              <strong>Gas estimation fix</strong> — HEX stakeEnd requires ~5M gas, but wallets were estimating only
              ~150K, causing every transaction to silently fail. Now forces adequate gas.
            </li>
            <li>
              <strong>Approve Hash method</strong> — added on-chain hash approval as an alternative signing method,
              since some wallets (like Rabby) hang on EIP-712 typed data signing with Safe v1.1.1.
            </li>
            <li>
              <strong>Stake index tracking</strong> — fixed a bug where sorting stakes for display caused the wrong
              stake index to be passed to stakeEnd.
            </li>
          </ul>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" fontWeight="bold">
            Open Source
          </Typography>
          Source code:{" "}
          <Link href="https://github.com/proestever/PulseChain-Safe-HEX-Stake-Rescue" target="_blank" rel="noopener noreferrer">
            github.com/proestever/PulseChain-Safe-HEX-Stake-Rescue
          </Link>
          <br />
          Use this dApp <strong>at your own risk</strong>. Never share your seed phrase with anyone.
        </Box>
      </CardContent>
    </Card>
  );
};

export default About;
