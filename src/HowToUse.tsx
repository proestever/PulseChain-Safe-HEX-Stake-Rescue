import { Card, CardContent, Typography, Box, Link } from "@mui/material";

const HowToUse = () => {
  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          How to Use
        </Typography>

        <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
          1. Connect Your Wallet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click "Connect Wallet" in the top right. Use the wallet that is an owner/signer of the Safe
          contract — this is the account that will authorize the transaction.
        </Typography>

        <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
          2. Select the Right Network
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Use the chain switcher to select PulseChain (for PLS stakes) or Ethereum (for ETH stakes).
          Make sure your wallet is on the correct network.
        </Typography>

        <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
          3. Enter Your Safe Address
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Paste your Safe (Gnosis Safe) contract address into the address field and click "Go".
          The app will load the Safe's owners, balances, and active HEX stakes.
        </Typography>

        <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
          4. Select a Stake to End
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          From the stake list, click the "End Stake" button next to the stake you want to end.
          This opens the transaction signing dialog.
        </Typography>

        <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
          5. Sign the Transaction
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Use <strong>Method 2 (Approve Hash)</strong> — this works with any wallet including MetaMask and Rabby.
        </Typography>
        <Box sx={{ pl: 2, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Step 1:</strong> Click "Approve Hash" to approve the transaction hash on-chain. This sends a small
            transaction to the Safe contract registering your approval.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <strong>Step 2:</strong> Once the approval is confirmed, click "Broadcast" to execute the Safe transaction
            that ends the stake. The HEX tokens will be returned to the Safe.
          </Typography>
        </Box>

        <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
          6. Transfer Funds Out
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          After ending stakes, use the HEX Transfer or Native Transfer forms to move funds
          from the Safe to your personal wallet.
        </Typography>

        <Box sx={{ mt: 3, p: 2, borderRadius: '10px', bgcolor: 'action.hover' }}>
          <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
            StakerApp Users
          </Typography>
          <Typography variant="body2" color="text.secondary">
            If you used StakerApp, import your StakerApp signing wallet (the first account from your seed phrase)
            into{" "}<Link href="https://metamask.io/" target="_blank" rel="noopener noreferrer">MetaMask</Link>{" "}
            or Rabby. Then enter your internal Safe address — this is the contract address StakerApp created
            for your stakes, not your wallet address.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default HowToUse;
