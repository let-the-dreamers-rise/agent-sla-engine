import React, { useState, useEffect, useCallback } from 'react';
import { usePublicClient, useContractEvent } from 'wagmi';
import { Interface, formatEther, ZeroAddress } from 'ethers';
import { AGENT_SLA_ABI, AGENT_SLA_ADDRESS } from '../contracts/config';

function SLATimeline({ slaId }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();

  // Listen for new events in real-time
  useContractEvent({
    address: AGENT_SLA_ADDRESS,
    abi: AGENT_SLA_ABI,
    eventName: 'SLACreated',
    listener: (logs) => {
      logs.forEach(log => {
        if (log.args.slaId.toString() === slaId.toString()) {
          fetchEvents();
        }
      });
    },
  });

  useContractEvent({
    address: AGENT_SLA_ADDRESS,
    abi: AGENT_SLA_ABI,
    eventName: 'WorkerSelected',
    listener: (logs) => {
      logs.forEach(log => {
        if (log.args.slaId.toString() === slaId.toString()) {
          fetchEvents();
        }
      });
    },
  });

  useContractEvent({
    address: AGENT_SLA_ADDRESS,
    abi: AGENT_SLA_ABI,
    eventName: 'VerifierStaked',
    listener: (logs) => {
      logs.forEach(log => {
        if (log.args.slaId.toString() === slaId.toString()) {
          fetchEvents();
        }
      });
    },
  });

  useContractEvent({
    address: AGENT_SLA_ADDRESS,
    abi: AGENT_SLA_ABI,
    eventName: 'VerificationSubmitted',
    listener: (logs) => {
      logs.forEach(log => {
        if (log.args.slaId.toString() === slaId.toString()) {
          fetchEvents();
        }
      });
    },
  });

  useContractEvent({
    address: AGENT_SLA_ADDRESS,
    abi: AGENT_SLA_ABI,
    eventName: 'SLAResolved',
    listener: (logs) => {
      logs.forEach(log => {
        if (log.args.slaId.toString() === slaId.toString()) {
          fetchEvents();
        }
      });
    },
  });

  const fetchEvents = useCallback(async () => {
    if (!publicClient || slaId === undefined) return;
    
    setIsLoading(true);
    try {
      const logs = await publicClient.getLogs({
        address: AGENT_SLA_ADDRESS,
        fromBlock: 0n,
        toBlock: 'latest'
      });

      const iface = new Interface(AGENT_SLA_ABI);
      const decodedEvents = [];

      logs.forEach(log => {
        try {
          const decoded = iface.parseLog(log);
          if (decoded && decoded.args.slaId && decoded.args.slaId.toString() === slaId.toString()) {
            decodedEvents.push({
              ...decoded,
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash
            });
          }
        } catch (error) {
          // Skip logs that can't be decoded
        }
      });

      const sortedEvents = decodedEvents.sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber));
      setEvents(sortedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, slaId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (isLoading) {
    return (
      <div style={{ 
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#0f172a', 
          marginBottom: '16px',
          margin: '0 0 16px 0'
        }}>
          SLA Resolution Timeline
        </h3>
        <div style={{ color: '#64748b' }}>Loading timeline events...</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div style={{ 
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#0f172a', 
          marginBottom: '16px',
          margin: '0 0 16px 0'
        }}>
          SLA Resolution Timeline
        </h3>
        <div style={{ 
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center',
          color: '#64748b'
        }}>
          No events found for SLA {slaId}. Create an SLA to see the autonomous resolution process.
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '32px'
    }}>
      <h3 style={{ 
        fontSize: '18px', 
        fontWeight: '600', 
        color: '#0f172a', 
        marginBottom: '16px',
        margin: '0 0 16px 0'
      }}>
        SLA Resolution Timeline
      </h3>
      <div style={{ 
        backgroundColor: '#dbeafe',
        border: '1px solid #93c5fd',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '20px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#1e40af'
      }}>
        This timeline shows exactly HOW and WHY this SLA was resolved automatically without human intervention
      </div>
      <div style={{ marginTop: '20px' }}>
        {events.map((event, index) => (
          <TimelineEntry key={index} event={event} />
        ))}
      </div>
    </div>
  );
}

function TimelineEntry({ event }) {
  const getEventDescription = () => {
    switch (event.name) {
      case 'SLACreated':
        return {
          title: 'STEP 1: ESCROW LOCKED',
          description: `Manager deposited ${formatEther(event.args.escrowAmount)} MNEE tokens into smart contract escrow. Set verifier stake requirement at ${formatEther(event.args.verifierStake)} MNEE each.`,
          explanation: 'WHY ESCROW WORKS: Payment is guaranteed and locked in the contract. Manager cannot withdraw until verifiers decide. This ensures workers get paid if they complete satisfactory work.',
          color: '#10b981',
          bgColor: '#ecfdf5'
        };
      
      case 'WorkerSelected':
        return {
          title: 'STEP 2: WORKER CHOSEN',
          description: `Manager selected worker who bid ${formatEther(event.args.acceptedBid)} MNEE tokens for the work.`,
          explanation: 'WHY BIDDING WORKS: Worker will receive exactly this bid amount if verifiers approve. Any remaining escrow returns to manager automatically.',
          color: '#f59e0b',
          bgColor: '#fffbeb'
        };
      
      case 'VerifierStaked':
        const verifierNum = event.args.isFirstVerifier ? 'FIRST' : 'SECOND';
        return {
          title: `STEP 3: ${verifierNum} VERIFIER STAKED`,
          description: `${verifierNum} verifier locked their required stake to participate in verification process.`,
          explanation: 'WHY VERIFIER STAKING WORKS: Verifiers must risk their own money to evaluate work. Dishonest verifiers lose their stake, ensuring fair judgment.',
          color: '#8b5cf6',
          bgColor: '#faf5ff'
        };
      
      case 'VerificationSubmitted':
        const decision = event.args.decision === 1 ? 'APPROVED' : 'REJECTED';
        return {
          title: 'STEP 4: VERIFICATION DECISION',
          description: `Verifier submitted decision: ${decision}`,
          explanation: 'WHY TWO VERIFIERS: Prevents single point of failure. System waits for both decisions before resolving automatically.',
          color: event.args.decision === 1 ? '#10b981' : '#ef4444',
          bgColor: event.args.decision === 1 ? '#ecfdf5' : '#fef2f2'
        };
      
      case 'SLAResolved':
        if (event.args.approved) {
          return {
            title: 'FINAL: SLA RESOLVED - WORK APPROVED',
            description: `BOTH verifiers agreed to APPROVE. Worker automatically received payment. Both verifiers got their stakes back. Any remaining escrow returned to manager.`,
            explanation: 'WHY AUTOMATIC RESOLUTION: Smart contract executed payments instantly when consensus reached. No humans needed - code is law.',
            color: '#10b981',
            bgColor: '#ecfdf5'
          };
        } else if (event.args.slashedVerifier !== ZeroAddress) {
          return {
            title: 'FINAL: SLA RESOLVED - VERIFIER DISAGREEMENT',
            description: `Verifiers DISAGREED on work quality. System automatically slashed minority verifier ${formatEther(event.args.slashAmount)} MNEE. Manager received full escrow refund. Majority verifier kept their stake.`,
            explanation: 'WHY SLASHING PREVENTS GAMING: When verifiers disagree, minority loses stake. This prevents collusion and ensures honest evaluation. System always resolves disputes automatically.',
            color: '#ef4444',
            bgColor: '#fef2f2'
          };
        } else {
          return {
            title: 'FINAL: SLA RESOLVED - WORK REJECTED',
            description: `BOTH verifiers agreed to REJECT work. Manager automatically received full escrow refund. Both verifiers got their stakes back.`,
            explanation: 'WHY AUTOMATIC REFUND: Smart contract protects managers from poor work. When consensus rejects, escrow returns instantly.',
            color: '#ef4444',
            bgColor: '#fef2f2'
          };
        }
      
      default:
        return {
          title: 'Unknown Event',
          description: 'Unknown event type',
          explanation: '',
          color: '#64748b',
          bgColor: '#f8fafc'
        };
    }
  };

  const { title, description, explanation, color, bgColor } = getEventDescription();

  return (
    <div style={{ 
      marginBottom: '16px', 
      padding: '20px', 
      backgroundColor: bgColor,
      border: `1px solid ${color}20`,
      borderLeft: `4px solid ${color}`,
      borderRadius: '12px'
    }}>
      <div style={{ 
        fontWeight: '600', 
        fontSize: '16px', 
        marginBottom: '8px',
        color: color
      }}>
        {title}
      </div>
      <div style={{ 
        marginBottom: '12px', 
        fontSize: '14px',
        lineHeight: '1.5',
        color: '#374151'
      }}>
        {description}
      </div>
      <div style={{ 
        fontSize: '13px', 
        color: '#1e40af', 
        fontWeight: '500',
        backgroundColor: '#dbeafe',
        padding: '8px 12px',
        borderRadius: '6px',
        marginBottom: '8px'
      }}>
        💡 {explanation}
      </div>
      <div style={{ 
        fontSize: '11px', 
        color: '#64748b', 
        fontFamily: 'monospace',
        backgroundColor: '#f1f5f9',
        padding: '4px 8px',
        borderRadius: '4px',
        display: 'inline-block'
      }}>
        Block: {event.blockNumber?.toString()} | Tx: {event.transactionHash?.slice(0, 16)}...
      </div>
    </div>
  );
}

export default SLATimeline;