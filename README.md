# AgentSLA Frontend

A minimal React frontend for interacting with the AgentSLA smart contract using wagmi and ethers.js.

## 🎮 Demo Mode

**Try it without any setup!** The app includes a fully functional Demo Mode that simulates the entire SLA lifecycle without requiring MetaMask or a local blockchain.

### For Hackathon Judges:
1. Visit the deployed URL
2. Demo Mode activates automatically (no wallet needed)
3. Click through the SLA lifecycle: CREATED → BIDDING → VERIFYING → RESOLVED
4. Use "Quick Action" buttons to advance states instantly

### Enable Demo Mode:
- **Automatic**: Demo Mode enables when no wallet is detected
- **Manual**: Click "Try Demo Mode" button in the top banner
- **Environment**: Set `REACT_APP_DEMO_MODE=true` for Vercel deployment

## Features

- **Wallet Connection**: Connect MetaMask wallet
- **MNEE Balance**: Display current MNEE token balance
- **SLA Management**: Create SLAs with escrow and verifier stake
- **Bidding System**: Submit bids and select workers
- **Verification Process**: Stake as verifier and submit approvals/rejections
- **State Tracking**: Clear display of SLA states (CREATED, BIDDING, VERIFYING, RESOLVED)
- **Transaction Monitoring**: Display transaction hashes for all actions

## 💰 MNEE Integration

This project is built for the **MNEE Hackathon** and uses MNEE (ERC-20 on Ethereum) as required.

### Contract Addresses

| Environment | MNEE Address | Description |
|-------------|--------------|-------------|
| **Production** | `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF` | Real MNEE on Ethereum Mainnet |
| **Demo/Local** | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | MockMNEE on local Hardhat |

### How It Works

- **Production Mode**: Uses the real MNEE contract on Ethereum Mainnet. Set `REACT_APP_USE_MAINNET=true` to enable.
- **Demo Mode**: Uses MockMNEE with identical ERC-20 semantics (balanceOf, approve, allowance, transfer). This allows judges and users to test the full SLA lifecycle without risking real funds.

### Why Demo Mode Exists

1. **Judge Accessibility**: Judges can evaluate the project without needing real ETH or MNEE
2. **Safety**: No risk of losing real funds during testing
3. **Full Functionality**: Demo mode simulates the complete SLA workflow with the same logic
4. **Transparency**: The UI clearly labels when Demo Mode is active

### Configuration

```javascript
// src/contracts/config.js
export const MNEE_MAINNET = '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF'; // Real MNEE
export const MNEE_MOCK_LOCAL = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Mock MNEE

// Environment variable to switch modes
// REACT_APP_USE_MAINNET=true → Production (Real MNEE)
// REACT_APP_USE_MAINNET=false or unset → Demo (Mock MNEE)
```

### Important Notes

- The production logic is **unchanged** — only the token address switches
- MockMNEE implements the same ERC-20 interface as real MNEE
- All escrow, staking, and payment logic works identically in both modes

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update contract addresses in `src/contracts/config.js`:
   - Replace `AGENT_SLA_ADDRESS` with your deployed AgentSLA contract address
   - Replace `MNEE_TOKEN_ADDRESS` with your deployed MNEE token address

3. Start the development server:
```bash
npm start
```

## Usage

### For Managers:
1. Connect your wallet
2. Ensure you have MNEE tokens and have approved the AgentSLA contract
3. Create an SLA with escrow amount, verifier stake, and description
4. Wait for workers to submit bids
5. Select a worker from the submitted bids

### For Workers:
1. Connect your wallet
2. Find an SLA in CREATED state
3. Submit a bid with your desired payment amount

### For Verifiers:
1. Connect your wallet
2. Ensure you have MNEE tokens and have approved the AgentSLA contract
3. Find an SLA in BIDDING state
4. Stake as a verifier (first two verifiers are accepted)
5. Once both verifiers have staked, submit your verification decision

## Contract Integration

The frontend uses wagmi hooks for:
- Reading contract state (SLA details, balances, bids)
- Writing to contracts (creating SLAs, submitting bids, staking, verifying)
- Real-time updates through contract event watching

## File Structure

```
src/
├── App.js                      # Main app with wagmi config + demo mode
├── components/
│   ├── AgentSLAInterface.js    # Live blockchain interface
│   ├── DemoAgentSLAInterface.js # Demo mode interface
│   ├── DemoBanner.js           # Demo/Live mode toggle banner
│   ├── DemoSLATimeline.js      # Demo timeline component
│   └── SLATimeline.js          # Live timeline component
├── context/
│   └── DemoContext.js          # Demo state management
├── contracts/
│   └── config.js               # Contract addresses and ABIs
├── hooks/
│   └── useAgentSLA.js          # Custom wagmi hooks
└── index.js                    # React entry point
```

## Notes

- The interface is intentionally minimal with no styling focus
- All transaction hashes are displayed for transparency
- Real-time updates are enabled through wagmi's watch functionality
- Error handling is built into the wagmi hooks
- The interface automatically validates inputs and enables/disables buttons accordingly