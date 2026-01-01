// =============================================================================
// MNEE HACKATHON COMPLIANCE
// =============================================================================
// This project uses MNEE (ERC-20 on Ethereum) as required by hackathon rules.
// Production: Real MNEE contract on Ethereum Mainnet
// Demo/Local: MockMNEE with identical ERC-20 interface for safe testing
// =============================================================================

// MNEE Token Addresses
export const MNEE_MAINNET = '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF'; // Real MNEE on Ethereum
export const MNEE_MOCK_LOCAL = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // MockMNEE on Hardhat

// AgentSLA Contract Addresses
export const AGENT_SLA_MAINNET = '0x0000000000000000000000000000000000000000'; // TODO: Deploy to mainnet
export const AGENT_SLA_LOCAL = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'; // Local Hardhat deployment

// Chain IDs
export const CHAIN_IDS = {
  MAINNET: 1,
  HARDHAT: 31337,
};

// Contract configuration by environment
export const CONTRACTS = {
  production: {
    mnee: MNEE_MAINNET,
    agentSLA: AGENT_SLA_MAINNET,
    chainId: CHAIN_IDS.MAINNET,
    label: 'Production (Real MNEE)',
  },
  demo: {
    mnee: MNEE_MOCK_LOCAL,
    agentSLA: AGENT_SLA_LOCAL,
    chainId: CHAIN_IDS.HARDHAT,
    label: 'Demo (Mock MNEE)',
  },
};

// Determine current environment
// Priority: ENV var > Chain ID detection > Default to demo
const getEnvironment = () => {
  // Check for explicit environment variable
  if (process.env.REACT_APP_USE_MAINNET === 'true') {
    return 'production';
  }
  // Default to demo for safety (no real funds at risk)
  return 'demo';
};

const currentEnv = getEnvironment();
const currentContracts = CONTRACTS[currentEnv];

// Export active addresses (used throughout the app)
export const AGENT_SLA_ADDRESS = currentContracts.agentSLA;
export const MNEE_TOKEN_ADDRESS = currentContracts.mnee;
export const CURRENT_ENV_LABEL = currentContracts.label;
export const IS_PRODUCTION = currentEnv === 'production';

// AgentSLA Contract ABI
export const AGENT_SLA_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_mneeToken",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "slaId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "worker",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "bidAmount",
        "type": "uint256"
      }
    ],
    "name": "BidSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "slaId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "manager",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "escrowAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "verifierStake",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "description",
        "type": "string"
      }
    ],
    "name": "SLACreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "slaId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "worker",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "slashedVerifier",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "slashAmount",
        "type": "uint256"
      }
    ],
    "name": "SLAResolved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "slaId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "verifier",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "enum AgentSLA.VerifierDecision",
        "name": "decision",
        "type": "uint8"
      }
    ],
    "name": "VerificationSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "slaId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "verifier",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isFirstVerifier",
        "type": "bool"
      }
    ],
    "name": "VerifierStaked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "slaId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "worker",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "acceptedBid",
        "type": "uint256"
      }
    ],
    "name": "WorkerSelected",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "bids",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_escrowAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_verifierStake",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      }
    ],
    "name": "createSLA",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "slaId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_slaId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_worker",
        "type": "address"
      }
    ],
    "name": "getBid",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_slaId",
        "type": "uint256"
      }
    ],
    "name": "getSLA",
    "outputs": [
      {
        "internalType": "address",
        "name": "manager",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "worker",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "verifier1",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "verifier2",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "escrowAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "verifierStake",
        "type": "uint256"
      },
      {
        "internalType": "enum AgentSLA.SLAState",
        "name": "state",
        "type": "uint8"
      },
      {
        "internalType": "enum AgentSLA.VerifierDecision",
        "name": "decision1",
        "type": "uint8"
      },
      {
        "internalType": "enum AgentSLA.VerifierDecision",
        "name": "decision2",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mneeToken",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextSLAId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_slaId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_worker",
        "type": "address"
      }
    ],
    "name": "selectWorker",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "slas",
    "outputs": [
      {
        "internalType": "address",
        "name": "manager",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "worker",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "verifier1",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "verifier2",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "escrowAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "verifierStake",
        "type": "uint256"
      },
      {
        "internalType": "enum AgentSLA.SLAState",
        "name": "state",
        "type": "uint8"
      },
      {
        "internalType": "enum AgentSLA.VerifierDecision",
        "name": "decision1",
        "type": "uint8"
      },
      {
        "internalType": "enum AgentSLA.VerifierDecision",
        "name": "decision2",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_slaId",
        "type": "uint256"
      }
    ],
    "name": "stakeAsVerifier",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_slaId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_bidAmount",
        "type": "uint256"
      }
    ],
    "name": "submitBid",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_slaId",
        "type": "uint256"
      },
      {
        "internalType": "enum AgentSLA.VerifierDecision",
        "name": "_decision",
        "type": "uint8"
      }
    ],
    "name": "submitVerification",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// MNEE Token ABI (minimal ERC20)
export const MNEE_TOKEN_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];