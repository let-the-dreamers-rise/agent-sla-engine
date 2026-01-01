import React from 'react';
import { useDemo } from '../context/DemoContext';
import { IS_PRODUCTION } from '../contracts/config';

function DemoBanner() {
  const { isDemoMode, toggleDemoMode } = useDemo();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: isDemoMode ? '#fef3c7' : '#f0fdf4',
      borderBottom: isDemoMode ? '2px solid #f59e0b' : '2px solid #22c55e',
      padding: '8px 16px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '16px',
    }}>
      {isDemoMode ? (
        <>
          <span style={{
            backgroundColor: '#f59e0b',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            🎮 Demo Mode (Mock MNEE)
          </span>
          <span style={{ fontSize: '13px', color: '#92400e', fontWeight: '500' }}>
            Simulated blockchain — no real transactions. Click buttons to see state transitions!
          </span>
        </>
      ) : (
        <>
          <span style={{
            backgroundColor: '#22c55e',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            🔗 Live Mode ({IS_PRODUCTION ? 'Real MNEE' : 'Mock MNEE'})
          </span>
          <span style={{ fontSize: '13px', color: '#166534', fontWeight: '500' }}>
            {IS_PRODUCTION 
              ? 'Connected to Ethereum Mainnet with real MNEE' 
              : 'Connected to local Hardhat node with Mock MNEE'}
          </span>
        </>
      )}
      
      <button
        onClick={toggleDemoMode}
        style={{
          backgroundColor: isDemoMode ? '#3b82f6' : '#f59e0b',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '6px 16px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          marginLeft: '8px',
        }}
      >
        {isDemoMode ? 'Switch to Live Mode' : 'Try Demo Mode'}
      </button>
    </div>
  );
}

export default DemoBanner;
