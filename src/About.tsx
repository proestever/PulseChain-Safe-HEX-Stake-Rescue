import { Card, CardContent, Typography, Box, Link } from "@mui/material";

const About = () => {
  return (
    <Card elevation={3} sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold">
          About
        </Typography>
        <Box>
          This dApp was originally created by @FutureUs (gruvin) and later forked and improved to fix critical issues
          with gas estimation and Safe v1.1.1 compatibility. The source code is available on{" "}
          <Link href="https://github.com/proestever/PulseChain-Safe-HEX-Stake-Rescue" target="_blank" rel="noopener noreferrer">
            GitHub
          </Link>{" "}
          for security and transparency. If you choose to use this dApp, you do so{" "}
          <strong>STRICTLY AT YOUR OWN RISK</strong>. Every known precaution has been taken to ensure your safety
          but we cannot be held responsible for misuse or potential interference by unknown parties.
        </Box>
        <Box sx={{ mt: 2 }}>
          Never share your seed phrase with anyone ever — not even yourself via any electronic means. EVER! No
          exceptions. There's always a way to get legitimate help without sharing seed phrases. ALWAYS.
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" fontWeight="bold">
            Background and Intended Use
          </Typography>
          <Link href="https://safe.global/" target="_blank" rel="noopener noreferrer">
            Safe™
          </Link>{" "}
          (formerly Gnosis Safe) was used by the HEX community's now-defunct StakerApp. This dApp enables users to end
          HEX stakes held in a Safe™ smart contract wallet and recover the resulting HEX balance to a standard account.
          It supports both Ethereum and PulseChain networks.
        </Box>
        <Box sx={{ mt: 2 }}>
          Safe™ does not support PulseChain, likely due to their stance on the widespread criticism and distrust
          surrounding <Link href="https://x.com/RichardHeartWin">@RichardHeartWin</Link>.{" "}
          <Box component="span" sx={{ color: "purple", fontWeight: "bold" }}>
            #themarkethasdecided
          </Box>{" "}
          (an inside joke).
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" fontWeight="bold">
            StakerApp
          </Typography>
          To use this dApp with your StakerApp account, create an instance of your StakerApp signing wallet (the first
          account from your seed phrase) in a wallet such as <Link href="https://metamask.io/">MetaMask</Link>. Then,
          enter the address of the internal Safe™ account in the "Safe Address" input field.
        </Box>
        <Box sx={{ mt: 2 }}>
          Efforts are underway to recover internal Safe™ addresses for StakerApp users who do not know theirs. No
          timeline is available for this potential feature. Rumors suggest the original StakerApp developer(s) may be
          able to assist, but the author, who never used StakerApp, does not know how to contact them.
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" fontWeight="bold">
            Safe™ Native HEX Stakes
          </Typography>
          If you created HEX stakes directly on <Link href="https://safe.global">Safe's official website</Link> before
          the PulseChain fork (using their WalletConnect app to connect to your preferred HEX dApp interface), you can
          use this dApp to end those stakes on the PulseChain network or as a more convenient way to end stakes on
          Ethereum.
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" fontWeight="bold">
            Open Source
          </Typography>
          The source code for this dApp can be viewed at{" "}
          <Link href="https://github.com/proestever/PulseChain-Safe-HEX-Stake-Rescue" target="_blank" rel="noopener noreferrer">
            https://github.com/proestever/PulseChain-Safe-HEX-Stake-Rescue
          </Link>
          .
        </Box>
      </CardContent>
    </Card>
  );
};

export default About;
