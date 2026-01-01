import React from 'react';
import { useDemo } from '../context/DemoContext';

function DemoSLATimeline({ slaId }) {
  const { demoEvents, demoSLAs } = useDemo();
  const events = demoEvents[slaId] || [];
  const sla = demoSLAs[slaId];

  if (!sla) {
    return (
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0' }}>SLA Resolution Timeline (Demo)</h3>
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', textAlign: 'center', color: '#64748b' }}>
          No events found for SLA {slaId}. Create an SLA to see the autonomous resolution process.
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0' }}>SLA Resolution Timeline (Demo)</h3>
      <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', padding: '12px', marginBottom: '20px', fontSize: '14px', fontWeight: '500', color: '#92400e' }}>
        🎮 Demo Mode — This timeline shows simulated events. Click "Quick Action" buttons to advance the SLA lifecycle!
      </div>
      <div style={{ marginTop: '20px' }}>
        {events.map((event, index) => (
          <DemoTimelineEntry key={index} event={event} />
        ))}
        {events.length === 0 && (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
            No events yet. Use the action buttons to progress the SLA.
          </div>
        )}
      </div>
    </div>
  );
}

function DemoTimelineEntry({ event }) {
  const formatEther = (val) => val ? (Number(val) / 1e18).toFixed(2) : '0';
  
  const getEventDescription = () => {
    switch (event.name) {
      case 'SLACreated':
        return {
          title: 'STEP 1: ESCROW LOCKED',
          description: `Manager deposited ${formatEther(event.args.escrowAmount)} MNEE tokens into smart contract escrow. Set verifier stake requirement at ${formatEther(event.args.verifierStake)} MNEE each.`,
          explanation: 'WHY ESCROW WORKS: Payment is guaranteed and locked in the contract. Manager cannot withdraw until verifiers decide.',
          color: '#10b981',
          bgColor: '#ecfdf5'
        };
      
      case 'WorkerSelected':
        return {
          title: 'STEP 2: WORKER CHOSEN',
          description: `Manager selected worker who bid ${formatEther(event.args.acceptedBid)} MNEE tokens for the work.`,
          explanation: 'WHY BIDDING WORKS: Worker will receive exactly this bid amount if verifiers approve.',
          color: '#f59e0b',
          bgColor: '#fffbeb'
        };
      
      case 'VerifierStaked':
        const verifierNum = event.args.isFirstVerifier ? 'FIRST' : 'SECOND';
        return {
          title: `STEP 3: ${verifierNum} VERIFIER STAKED`,
          description: `${verifierNum} verifier locked their required stake to participate in verification process.`,
          explanation: 'WHY VERIFIER STAKING WORKS: Verifiers must risk their own money to evaluate work.',
          color: '#8b5cf6',
          bgColor: '#faf5ff'
        };
      
      case 'VerificationSubmitted':
        const decision = event.args.decision === 1 ? 'APPROVED' : 'REJECTED';
        return {
          title: 'STEP 4: VERIFICATION DECISION',
          description: `Verifier submitted decision: ${decision}`,
          explanation: 'WHY TWO VERIFIERS: Prevents single point of failure.',
          color: event.args.decision === 1 ? '#10b981' : '#ef4444',
          bgColor: event.args.decision === 1 ? '#ecfdf5' : '#fef2f2'
        };
      
      case 'SLAResolved':
        return {
          title: 'FINAL: SLA RESOLVED',
          description: 'Both verifiers submitted decisions. Smart contract automatically distributed funds.',
          explanation: 'WHY AUTOMATIC RESOLUTION: Smart contract executed payments instantly when consensus reached.',
          color: '#10b981',
          bgColor: '#ecfdf5'
        };
      
      default:
        return {
          title: 'Event',
          description: event.name,
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
      <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '8px', color }}>
        {title}
      </div>
      <div style={{ marginBottom: '12px', fontSize: '14px', lineHeight: '1.5', color: '#374151' }}>
        {description}
      </div>
      <div style={{ fontSize: '13px', color: '#1e40af', fontWeight: '500', backgroundColor: '#dbeafe', padding: '8px 12px', borderRadius: '6px', marginBottom: '8px' }}>
        💡 {explanation}
      </div>
      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
        Demo Block: {event.blockNumber?.toString()} | Demo Tx: {event.transactionHash?.slice(0, 16)}...
      </div>
    </div>
  );
}

export default DemoSLATimeline;
