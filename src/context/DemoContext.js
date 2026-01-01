import React, { createContext, useContext, useState, useCallback } from 'react';

/* eslint-disable no-undef */

// Check if demo mode should be enabled by default (for Vercel deployment)
const DEFAULT_DEMO_MODE = process.env.REACT_APP_DEMO_MODE === 'true' || 
  (typeof window !== 'undefined' && !window.ethereum);

// Demo mode context
const DemoContext = createContext();

// Sample addresses for demo
const DEMO_ADDRESSES = {
  manager: '0x1234567890abcdef1234567890abcdef12345678',
  worker: '0xabcdef1234567890abcdef1234567890abcdef12',
  verifier1: '0x9876543210fedcba9876543210fedcba98765432',
  verifier2: '0xfedcba9876543210fedcba9876543210fedcba98',
  user: '0x5555555555555555555555555555555555555555',
};

// Initial demo SLA data
const createInitialSLA = () => ({
  manager: DEMO_ADDRESSES.manager,
  worker: null,
  verifier1: null,
  verifier2: null,
  escrowAmount: '100000000000000000000', // 100 MNEE
  verifierStake: '10000000000000000000', // 10 MNEE
  state: 0, // CREATED
  decision1: 0, // PENDING
  decision2: 0, // PENDING
  description: 'Build a responsive landing page with React',
});

// Demo events for timeline (using Number instead of BigInt for demo simplicity)
const createDemoEvents = (state, slaId) => {
  const events = [];
  
  if (state >= 0) {
    events.push({
      name: 'SLACreated',
      args: {
        slaId: slaId,
        manager: DEMO_ADDRESSES.manager,
        escrowAmount: '100000000000000000000',
        verifierStake: '10000000000000000000',
      },
      blockNumber: 1001,
      transactionHash: '0xdemo1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    });
  }
  
  if (state >= 1) {
    events.push({
      name: 'WorkerSelected',
      args: {
        slaId: slaId,
        worker: DEMO_ADDRESSES.worker,
        acceptedBid: '80000000000000000000',
      },
      blockNumber: 1002,
      transactionHash: '0xdemo2345678901bcdef2345678901bcdef2345678901bcdef2345678901bcde',
    });
  }
  
  if (state >= 2) {
    events.push({
      name: 'VerifierStaked',
      args: {
        slaId: slaId,
        verifier: DEMO_ADDRESSES.verifier1,
        isFirstVerifier: true,
      },
      blockNumber: 1003,
      transactionHash: '0xdemo3456789012cdef3456789012cdef3456789012cdef3456789012cdef34',
    });
    events.push({
      name: 'VerifierStaked',
      args: {
        slaId: slaId,
        verifier: DEMO_ADDRESSES.verifier2,
        isFirstVerifier: false,
      },
      blockNumber: 1004,
      transactionHash: '0xdemo4567890123def4567890123def4567890123def4567890123def456789',
    });
  }
  
  return events;
};

export function DemoProvider({ children }) {
  const [isDemoMode, setIsDemoMode] = useState(DEFAULT_DEMO_MODE);
  const [demoSLAs, setDemoSLAs] = useState({ 0: createInitialSLA() });
  // eslint-disable-next-line no-unused-vars
  const [demoBalance, setDemoBalance] = useState('1000000000000000000000'); // 1000 MNEE
  const [demoEvents, setDemoEvents] = useState({ 0: createDemoEvents(0, 0) });
  const [demoTxHash, setDemoTxHash] = useState('');
  const [demoStatus, setDemoStatus] = useState('');

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode(prev => !prev);
    // Reset demo state when toggling
    setDemoSLAs({ 0: createInitialSLA() });
    setDemoEvents({ 0: createDemoEvents(0, 0) });
    setDemoTxHash('');
    setDemoStatus('');
  }, []);

  // Demo action: Create SLA
  const demoCreateSLA = useCallback((escrowAmount, verifierStake, description) => {
    const newId = Object.keys(demoSLAs).length;
    const newSLA = {
      manager: DEMO_ADDRESSES.user,
      worker: null,
      verifier1: null,
      verifier2: null,
      escrowAmount: (parseFloat(escrowAmount) * 1e18).toString(),
      verifierStake: (parseFloat(verifierStake) * 1e18).toString(),
      state: 0,
      decision1: 0,
      decision2: 0,
      description,
    };
    
    setDemoSLAs(prev => ({ ...prev, [newId]: newSLA }));
    setDemoEvents(prev => ({ ...prev, [newId]: createDemoEvents(0, newId) }));
    setDemoTxHash('0xdemo' + Math.random().toString(16).slice(2, 66));
    setDemoStatus(`SLA #${newId} created successfully! (Demo)`);
    
    return newId;
  }, [demoSLAs]);

  // Demo action: Submit Bid
  const demoSubmitBid = useCallback((slaId, bidAmount) => {
    setDemoTxHash('0xdemo' + Math.random().toString(16).slice(2, 66));
    setDemoStatus(`Bid of ${bidAmount} MNEE submitted! (Demo)`);
  }, []);

  // Demo action: Select Worker (transitions to BIDDING state)
  const demoSelectWorker = useCallback((slaId) => {
    setDemoSLAs(prev => ({
      ...prev,
      [slaId]: {
        ...prev[slaId],
        worker: DEMO_ADDRESSES.worker,
        state: 1, // BIDDING
      }
    }));
    setDemoEvents(prev => ({
      ...prev,
      [slaId]: createDemoEvents(1, slaId),
    }));
    setDemoTxHash('0xdemo' + Math.random().toString(16).slice(2, 66));
    setDemoStatus('Worker selected! SLA moved to BIDDING state. (Demo)');
  }, []);

  // Demo action: Stake as Verifier (transitions to VERIFYING when 2 verifiers)
  const demoStakeAsVerifier = useCallback((slaId) => {
    setDemoSLAs(prev => {
      const sla = prev[slaId];
      let newState = sla.state;
      let v1 = sla.verifier1;
      let v2 = sla.verifier2;
      
      if (!v1) {
        v1 = DEMO_ADDRESSES.verifier1;
      } else if (!v2) {
        v2 = DEMO_ADDRESSES.verifier2;
        newState = 2; // VERIFYING
      }
      
      return {
        ...prev,
        [slaId]: { ...sla, verifier1: v1, verifier2: v2, state: newState }
      };
    });
    
    setDemoEvents(prev => {
      const sla = demoSLAs[slaId];
      const newState = !sla.verifier1 ? 1 : 2;
      return { ...prev, [slaId]: createDemoEvents(newState, slaId) };
    });
    
    setDemoTxHash('0xdemo' + Math.random().toString(16).slice(2, 66));
    setDemoStatus('Staked as verifier! (Demo)');
  }, [demoSLAs]);

  // Demo action: Submit Verification (transitions to RESOLVED when both verify)
  const demoSubmitVerification = useCallback((slaId, decision) => {
    setDemoSLAs(prev => {
      const sla = prev[slaId];
      let d1 = sla.decision1;
      let d2 = sla.decision2;
      let newState = sla.state;
      
      if (d1 === 0) {
        d1 = decision === 'approve' ? 1 : 2;
      } else if (d2 === 0) {
        d2 = decision === 'approve' ? 1 : 2;
        newState = 3; // RESOLVED
      }
      
      return {
        ...prev,
        [slaId]: { ...sla, decision1: d1, decision2: d2, state: newState }
      };
    });
    
    setDemoTxHash('0xdemo' + Math.random().toString(16).slice(2, 66));
    setDemoStatus(`Verification ${decision}d! (Demo)`);
  }, []);

  // Advance demo through all states automatically
  const advanceDemoState = useCallback((slaId) => {
    const sla = demoSLAs[slaId];
    if (!sla) return;
    
    switch (sla.state) {
      case 0: // CREATED -> BIDDING
        demoSelectWorker(slaId);
        break;
      case 1: // BIDDING -> VERIFYING (need 2 verifiers)
        demoStakeAsVerifier(slaId);
        break;
      case 2: // VERIFYING -> RESOLVED
        demoSubmitVerification(slaId, 'approve');
        break;
      default:
        break;
    }
  }, [demoSLAs, demoSelectWorker, demoStakeAsVerifier, demoSubmitVerification]);

  const value = {
    isDemoMode,
    toggleDemoMode,
    demoSLAs,
    demoBalance,
    demoEvents,
    demoTxHash,
    demoStatus,
    demoAddresses: DEMO_ADDRESSES,
    // Actions
    demoCreateSLA,
    demoSubmitBid,
    demoSelectWorker,
    demoStakeAsVerifier,
    demoSubmitVerification,
    advanceDemoState,
    setDemoStatus,
    setDemoTxHash,
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}

export default DemoContext;
