import React, { useState } from 'react';
import { useDemo } from '../context/DemoContext';
import DemoSLATimeline from './DemoSLATimeline';

const SLA_STATES = ['CREATED', 'BIDDING', 'VERIFYING', 'RESOLVED'];
// eslint-disable-next-line no-unused-vars
const VERIFIER_DECISIONS = ['PENDING', 'APPROVE', 'REJECT'];
const STATE_COLORS = {
  0: { bg: '#dbeafe', text: '#1e40af', label: 'Accepting Bids' },
  1: { bg: '#fef3c7', text: '#92400e', label: 'Awaiting Verifiers' },
  2: { bg: '#e0e7ff', text: '#3730a3', label: 'Under Review' },
  3: { bg: '#dcfce7', text: '#166534', label: 'Complete' }
};

function DemoAgentSLAInterface() {
  const { 
    demoSLAs, demoBalance, demoAddresses, demoTxHash, demoStatus,
    demoCreateSLA, demoSubmitBid, demoSelectWorker, 
    demoStakeAsVerifier, demoSubmitVerification, advanceDemoState
  } = useDemo();
  
  const [selectedSLAId, setSelectedSLAId] = useState(0);
  const [createForm, setCreateForm] = useState({ escrowAmount: '100', verifierStake: '10', description: '' });
  const [bidForm, setBidForm] = useState({ bidAmount: '80' });
  const [workerAddress, setWorkerAddress] = useState(demoAddresses.worker);

  const slaData = demoSLAs[selectedSLAId];
  const slaExists = Boolean(slaData);
  const slaState = slaExists ? slaData.state : null;

  return (
    <div>
      {/* Quick Demo Controls */}
      <DemoQuickControls slaId={selectedSLAId} slaState={slaState} advanceDemoState={advanceDemoState} />
      
      {/* Balance + SLA Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <DemoMNEEBalance balance={demoBalance} address={demoAddresses.user} />
        <DemoSLASelector selectedSLAId={selectedSLAId} setSelectedSLAId={setSelectedSLAId} slaCount={Object.keys(demoSLAs).length} />
      </div>

      {/* SLA State Banner */}
      {slaExists && (
        <div style={{
          backgroundColor: STATE_COLORS[slaState]?.bg || '#f1f5f9',
          border: `2px solid ${STATE_COLORS[slaState]?.text || '#64748b'}`,
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Current SLA State (Demo)
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: STATE_COLORS[slaState]?.text || '#0f172a' }}>
            {SLA_STATES[slaState]} — {STATE_COLORS[slaState]?.label}
          </div>
        </div>
      )}

      {/* SLA Details */}
      <DemoSLADetails slaId={selectedSLAId} slaData={slaData} address={demoAddresses.user} />

      {/* Timeline */}
      <DemoSLATimeline slaId={selectedSLAId} />

      {/* Actions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* Manager Actions */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>Manager Actions</h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>Create SLAs and select workers</p>
          
          <DemoCreateSLA form={createForm} setForm={setCreateForm} onCreate={demoCreateSLA} />
          
          {slaExists && slaState === 0 && (
            <DemoSelectWorker 
              workerAddress={workerAddress} 
              setWorkerAddress={setWorkerAddress}
              onSelect={() => demoSelectWorker(selectedSLAId)}
            />
          )}
        </div>

        {/* Worker Actions */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>Worker Actions</h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>Submit bids on open SLAs</p>
          
          {slaExists && slaState === 0 ? (
            <DemoSubmitBid form={bidForm} setForm={setBidForm} onSubmit={() => demoSubmitBid(selectedSLAId, bidForm.bidAmount)} />
          ) : (
            <div style={{ color: '#64748b', fontSize: '14px', padding: '20px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '8px' }}>
              {slaExists ? `Bidding closed (State: ${SLA_STATES[slaState]})` : 'Select an existing SLA to submit a bid'}
            </div>
          )}
        </div>

        {/* Verifier Actions */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>Verifier Actions</h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>Stake to verify and approve/reject work</p>
          
          {slaExists ? (
            <>
              {slaState === 1 && (
                <DemoStakeAsVerifier 
                  verifierStake={slaData.verifierStake}
                  onStake={() => demoStakeAsVerifier(selectedSLAId)}
                />
              )}
              {slaState === 2 && (
                <DemoSubmitVerification 
                  onSubmit={(decision) => demoSubmitVerification(selectedSLAId, decision)}
                />
              )}
              {slaState !== 1 && slaState !== 2 && (
                <div style={{ color: '#64748b', fontSize: '14px', padding: '20px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '8px' }}>
                  {slaState === 0 ? 'Waiting for worker selection' : 'SLA already resolved'}
                </div>
              )}
            </>
          ) : (
            <div style={{ color: '#64748b', fontSize: '14px', padding: '20px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '8px' }}>
              Select an existing SLA to stake as verifier
            </div>
          )}
        </div>
      </div>

      {/* Transaction Status */}
      {(demoStatus || demoTxHash) && (
        <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', padding: '16px' }}>
          {demoStatus && <div style={{ fontSize: '14px', color: '#92400e', marginBottom: demoTxHash ? '8px' : '0' }}><strong>Demo Status:</strong> {demoStatus}</div>}
          {demoTxHash && <div style={{ fontSize: '12px', color: '#78716c', fontFamily: 'monospace', wordBreak: 'break-all' }}><strong>Demo Tx:</strong> {demoTxHash}</div>}
        </div>
      )}
    </div>
  );
}

// Quick demo controls to advance state
function DemoQuickControls({ slaId, slaState, advanceDemoState }) {
  if (slaState === null || slaState === 3) return null;
  
  const actionLabel = {
    0: 'Select Worker → BIDDING',
    1: 'Add Verifiers → VERIFYING',
    2: 'Submit Approvals → RESOLVED',
  }[slaState];

  return (
    <div style={{
      backgroundColor: '#eff6ff',
      border: '2px dashed #3b82f6',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '24px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '13px', color: '#1e40af', marginBottom: '8px', fontWeight: '500' }}>
        🎮 Demo Quick Action — Click to advance the SLA lifecycle
      </div>
      <button
        onClick={() => advanceDemoState(slaId)}
        style={{
          backgroundColor: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '10px 24px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

function DemoMNEEBalance({ balance, address }) {
  const formatted = balance ? (parseFloat(balance) / 1e18).toFixed(2) : '0.00';
  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '500' }}>Your MNEE Balance (Demo)</div>
      <div style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>{formatted} MNEE</div>
      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', fontFamily: 'monospace' }}>
        Demo Address: {address.slice(0, 10)}...
      </div>
    </div>
  );
}

function DemoSLASelector({ selectedSLAId, setSelectedSLAId, slaCount }) {
  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '500' }}>
        View SLA ID (Demo)
      </label>
      <input 
        type="number" 
        value={selectedSLAId} 
        onChange={(e) => setSelectedSLAId(Math.max(0, Math.min(slaCount - 1, parseInt(e.target.value) || 0)))}
        min={0}
        max={slaCount - 1}
        style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px', fontWeight: '600' }}
      />
      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
        {slaCount} SLA(s) available in demo
      </div>
    </div>
  );
}

function DemoSLADetails({ slaId, slaData, address }) {
  if (!slaData) {
    return (
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#64748b' }}>SLA #{slaId} does not exist. Create one to get started!</div>
      </div>
    );
  }

  const { manager, worker, verifier1, verifier2, escrowAmount, verifierStake, state, decision1, decision2, description } = slaData;
  const formatAddr = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '—';
  const formatAmount = (amt) => amt ? (parseFloat(amt) / 1e18).toFixed(2) : '0';

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0' }}>SLA #{slaId} Details (Demo)</h3>
        <span style={{ fontSize: '11px', backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>
          Demo Data
        </span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
        <div><div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Manager</div><div style={{ fontSize: '13px', fontFamily: 'monospace' }}>{formatAddr(manager)}</div></div>
        <div><div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Worker</div><div style={{ fontSize: '13px', fontFamily: 'monospace' }}>{formatAddr(worker)}</div></div>
        <div><div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Verifier 1</div><div style={{ fontSize: '13px', fontFamily: 'monospace' }}>{formatAddr(verifier1)}</div></div>
        <div><div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Verifier 2</div><div style={{ fontSize: '13px', fontFamily: 'monospace' }}>{formatAddr(verifier2)}</div></div>
        <div><div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Escrow</div><div style={{ fontSize: '13px', fontWeight: '600' }}>{formatAmount(escrowAmount)} MNEE</div></div>
        <div><div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Verifier Stake</div><div style={{ fontSize: '13px', fontWeight: '600' }}>{formatAmount(verifierStake)} MNEE</div></div>
      </div>
      
      {description && <div style={{ fontSize: '13px', color: '#374151', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', marginBottom: '12px' }}><strong>Work:</strong> {description}</div>}
      
      {state >= 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ padding: '10px', backgroundColor: decision1 === 1 ? '#dcfce7' : decision1 === 2 ? '#fef2f2' : '#f8fafc', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: '#64748b' }}>V1 Decision</div>
            <div style={{ fontSize: '13px', fontWeight: '600' }}>{VERIFIER_DECISIONS[decision1]}</div>
          </div>
          <div style={{ padding: '10px', backgroundColor: decision2 === 1 ? '#dcfce7' : decision2 === 2 ? '#fef2f2' : '#f8fafc', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: '#64748b' }}>V2 Decision</div>
            <div style={{ fontSize: '13px', fontWeight: '600' }}>{VERIFIER_DECISIONS[decision2]}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function DemoCreateSLA({ form, setForm, onCreate }) {
  const handleCreate = () => {
    if (form.escrowAmount && form.verifierStake && form.description) {
      onCreate(form.escrowAmount, form.verifierStake, form.description);
      setForm({ escrowAmount: '100', verifierStake: '10', description: '' });
    }
  };

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '0 0 12px 0' }}>Create New SLA (Demo)</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '4px' }}>Escrow Amount (MNEE)</label>
        <input type="text" value={form.escrowAmount} onChange={(e) => setForm({...form, escrowAmount: e.target.value})}
          style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} placeholder="100" />
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '4px' }}>Verifier Stake (MNEE)</label>
        <input type="text" value={form.verifierStake} onChange={(e) => setForm({...form, verifierStake: e.target.value})}
          style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} placeholder="10" />
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '4px' }}>Work Description</label>
        <input type="text" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
          style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} placeholder="Describe the work..." />
      </div>
      
      <button onClick={handleCreate}
        style={{ width: '100%', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
        Create SLA (Demo)
      </button>
    </div>
  );
}

function DemoSelectWorker({ workerAddress, setWorkerAddress, onSelect }) {
  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '0 0 12px 0' }}>Select Worker (Demo)</h4>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '4px' }}>Worker Address</label>
        <input type="text" value={workerAddress} onChange={(e) => setWorkerAddress(e.target.value)}
          style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }} />
      </div>
      
      <button onClick={onSelect}
        style={{ width: '100%', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
        Select Worker (Demo)
      </button>
    </div>
  );
}

function DemoSubmitBid({ form, setForm, onSubmit }) {
  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '0 0 12px 0' }}>Submit Bid (Demo)</h4>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '4px' }}>Bid Amount (MNEE)</label>
        <input type="text" value={form.bidAmount} onChange={(e) => setForm({...form, bidAmount: e.target.value})}
          style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} placeholder="80" />
      </div>
      
      <button onClick={onSubmit}
        style={{ width: '100%', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
        Submit Bid (Demo)
      </button>
    </div>
  );
}

function DemoStakeAsVerifier({ verifierStake, onStake }) {
  const stakeAmount = verifierStake ? (parseFloat(verifierStake) / 1e18).toFixed(2) : '10';
  
  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '0 0 12px 0' }}>Stake as Verifier (Demo)</h4>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>Lock {stakeAmount} MNEE to become a verifier. 2 verifiers required.</p>
      
      <button onClick={onStake}
        style={{ width: '100%', backgroundColor: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
        Stake as Verifier (Demo)
      </button>
    </div>
  );
}

function DemoSubmitVerification({ onSubmit }) {
  const [decision, setDecision] = useState('');

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '0 0 12px 0' }}>Submit Verification (Demo)</h4>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <label style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '10px', border: decision === 'approve' ? '2px solid #10b981' : '1px solid #d1d5db',
          borderRadius: '6px', backgroundColor: decision === 'approve' ? '#ecfdf5' : '#fff', cursor: 'pointer' }}>
          <input type="radio" value="approve" checked={decision === 'approve'} onChange={(e) => setDecision(e.target.value)} style={{ marginRight: '6px' }} />
          <span style={{ fontSize: '13px', fontWeight: '500', color: decision === 'approve' ? '#059669' : '#374151' }}>Approve</span>
        </label>
        <label style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '10px', border: decision === 'reject' ? '2px solid #ef4444' : '1px solid #d1d5db',
          borderRadius: '6px', backgroundColor: decision === 'reject' ? '#fef2f2' : '#fff', cursor: 'pointer' }}>
          <input type="radio" value="reject" checked={decision === 'reject'} onChange={(e) => setDecision(e.target.value)} style={{ marginRight: '6px' }} />
          <span style={{ fontSize: '13px', fontWeight: '500', color: decision === 'reject' ? '#dc2626' : '#374151' }}>Reject</span>
        </label>
      </div>
      
      <button onClick={() => decision && onSubmit(decision)} disabled={!decision}
        style={{ width: '100%', backgroundColor: decision ? '#6366f1' : '#e5e7eb', color: decision ? '#fff' : '#9ca3af',
          border: 'none', borderRadius: '6px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: decision ? 'pointer' : 'not-allowed' }}>
        Submit Decision (Demo)
      </button>
    </div>
  );
}

export default DemoAgentSLAInterface;
