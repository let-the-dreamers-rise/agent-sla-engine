import React from 'react';
import { WagmiConfig, createConfig } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import AgentSLAInterface from './components/AgentSLAInterface';
import DemoAgentSLAInterface from './components/DemoAgentSLAInterface';
import DemoBanner from './components/DemoBanner';
import { DemoProvider, useDemo } from './context/DemoContext';

// Custom hardhat chain config for mainnet fork
const hardhatFork = {
  ...hardhat,
  id: 31337,
  name: 'Hardhat Fork',
  network: 'hardhat',
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
};

// Create public client for Hardhat fork
const publicClient = createPublicClient({
  chain: hardhatFork,
  transport: http('http://127.0.0.1:8545'),
});

// Create wagmi config
const config = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ 
      chains: [hardhatFork],
      options: {
        shimDisconnect: true,
      }
    }),
  ],
  publicClient: () => publicClient,
});

function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { isDemoMode } = useDemo();

  // In demo mode, show simulated wallet
  if (isDemoMode) {
    return (
      <div style={{ 
        backgroundColor: '#fef3c7',
        border: '2px solid #f59e0b',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '4px', fontWeight: '500' }}>
            🎮 Demo Wallet (Simulated)
          </div>
          <div style={{ fontSize: '16px', fontFamily: 'monospace', color: '#78350f', fontWeight: '500' }}>
            0x5555...5555
          </div>
        </div>
        <span style={{ backgroundColor: '#f59e0b', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
          Demo Mode Active
        </span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div style={{ 
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px', fontWeight: '500' }}>
            Connected Wallet
          </div>
          <div style={{ fontSize: '16px', fontFamily: 'monospace', color: '#0f172a', fontWeight: '500' }}>
            {address}
          </div>
        </div>
        <button 
          onClick={() => disconnect()}
          style={{
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#475569',
            cursor: 'pointer'
          }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '32px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '16px', color: '#64748b', marginBottom: '16px' }}>
        Connect your wallet to interact with AgentSLA
      </div>
      <button 
        onClick={() => connect({ connector: connectors[0] })}
        style={{
          backgroundColor: '#3b82f6',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '600',
          color: '#ffffff',
          cursor: 'pointer'
        }}
      >
        Connect MetaMask
      </button>
    </div>
  );
}

function MainContent() {
  const { isDemoMode } = useDemo();
  const { isConnected } = useAccount();

  return (
    <>
      <ConnectWallet />
      {isDemoMode ? (
        <DemoAgentSLAInterface />
      ) : (
        isConnected && <AgentSLAInterface />
      )}
    </>
  );
}

function App() {
  return (
    <DemoProvider>
      <WagmiConfig config={config}>
        <DemoBanner />
        <div style={{ 
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          color: '#1e293b',
          paddingTop: '50px' // Account for fixed banner
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
            <header style={{ 
              marginBottom: '40px',
              textAlign: 'center',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '24px'
            }}>
              <h1 style={{ fontSize: '32px', fontWeight: '600', margin: '0 0 8px 0', color: '#0f172a' }}>
                AgentSLA Protocol
              </h1>
              <p style={{ fontSize: '16px', color: '#64748b', margin: '0', fontWeight: '400' }}>
                Autonomous Service Level Agreements with Verifier Staking
              </p>
            </header>
            <MainContent />
          </div>
        </div>
      </WagmiConfig>
    </DemoProvider>
  );
}

export default App;
