import { Card, CardContent, Typography, Link } from "@mui/material";

const About = () => {
  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          About
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          This dApp helps PulseChain and Ethereum users end HEX stakes locked in Safe (formerly Gnosis Safe) smart
          contract wallets, including those created by the now-defunct StakerApp.
        </Typography>

        <Typography variant="body1" fontWeight="bold" sx={{ mt: 3 }}>
          Credits
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          Originally built by{" "}
          <Link href="https://github.com/gruvin/safe_stake_rescue" target="_blank" rel="noopener noreferrer">
            @FutureUs (gruvin)
          </Link>{" "}
          for Ethereum. This fork adds PulseChain support and fixes several critical issues:
        </Typography>
        <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
          <li>
            <strong>Safe v1.1.1 support</strong> — StakerApp uses Safe v1.1.1 which has a different EIP-712 domain
            separator (no chainId). The original app only supported v1.3.0+.
          </li>
          <li>
            <strong>Gas estimation fix</strong> — HEX stakeEnd requires ~5M gas, but wallets were estimating only
            ~150K, causing every transaction to silently fail.
          </li>
          <li>
            <strong>Approve Hash method</strong> — added on-chain hash approval as an alternative signing method,
            since some wallets hang on EIP-712 typed data signing with Safe v1.1.1.
          </li>
          <li>
            <strong>Stake index tracking</strong> — fixed a bug where sorting stakes for display caused the wrong
            stake index to be passed to stakeEnd.
          </li>
        </ul>

        <Typography variant="body1" fontWeight="bold" sx={{ mt: 3 }}>
          Open Source
        </Typography>
        <Typography variant="body1">
          Source code:{" "}
          <Link href="https://github.com/proestever/PulseChain-Safe-HEX-Stake-Rescue" target="_blank" rel="noopener noreferrer">
            github.com/proestever/PulseChain-Safe-HEX-Stake-Rescue
          </Link>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Use this dApp <strong>at your own risk</strong>. Never share your seed phrase with anyone.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default About;
