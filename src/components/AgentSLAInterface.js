import React, { useState } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { formatEther, parseEther, isAddress, ZeroAddress } from 'ethers';
import { AGENT_SLA_ABI, AGENT_SLA_ADDRESS, MNEE_TOKEN_ABI, MNEE_TOKEN_ADDRESS } from '../contracts/config';
import SLATimeline from './SLATimeline';

const SLA_STATES = ['CREATED', 'BIDDING', 'VERIFYING', 'RESOLVED'];
const VERIFIER_DECISIONS = ['PENDING', 'APPROVE', 'REJECT'];

const STATE_COLORS = {
  0: { bg: '#dbeafe', text: '#1e40af', label: 'Accepting Bids' },
  1: { bg: '#fef3c7', text: '#92400e', label: 'Awaiting Verifiers' },
  2: { bg: '#e0e7ff', text: '#3730a3', label: 'Under Review' },
  3: { bg: '#dcfce7', text: '#166534', label: 'Complete' }
};

function AgentSLAInterface() {
  const { address, isConnected } = useAccount();
  const [selectedSLAId, setSelectedSLAId] = useState(0);
  const [txHash, setTxHash] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [createSLAForm, setCreateSLAForm] = useState({ escrowAmount: '', verifierStake: '', description: '' });
  const [bidForm, setBidForm] = useState({ bidAmount: '' });
  const [workerAddress, setWorkerAddress] = useState('');

  const { data: slaData } = useContractRead({
    address: AGENT_SLA_ADDRESS,
    abi: AGENT_SLA_ABI,
    functionName: 'getSLA',
    args: [selectedSLAId],
    watch: true,
  });

  if (!isConnected) return null;

  const slaExists = slaData && slaData[0] !== ZeroAddress;
  const slaState = slaExists ? slaData[6] : null;
  const manager = slaExists ? slaData[0] : null;
  const isManager = manager && address && manager.toLowerCase() === address.toLowerCase();
  const worker = slaExists ? slaData[1] : null;
  const verifier1 = slaExists ? slaData[2] : null;
  const verifier2 = slaExists ? slaData[3] : null;
  const isVerifier = (verifier1 && address && verifier1.toLowerCase() === address.toLowerCase()) ||
                     (verifier2 && address && verifier2.toLowerCase() === address.toLowerCase());

  return (
    <div>
      {/* Top Bar: Balance + SLA Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <MNEEBalance address={address} />
        <SLASelector selectedSLAId={selectedSLAId} setSelectedSLAId={setSelectedSLAId} />
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
            Current SLA State
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: STATE_COLORS[slaState]?.text || '#0f172a' }}>
            {SLA_STATES[slaState]} — {STATE_COLORS[slaState]?.label}
          </div>
        </div>
      )}

      {/* SLA Details */}
      <SLADetails slaId={selectedSLAId} slaData={slaData} address={address} />

      {/* Timeline */}
      <SLATimeline slaId={selectedSLAId} />

      {/* Actions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* Manager Actions */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '4px', margin: '0 0 4px 0' }}>
            Manager Actions
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', margin: '0 0 16px 0' }}>
            Create SLAs and select workers
          </p>
          
          <CreateSLA 
            form={createSLAForm} 
            setForm={setCreateSLAForm} 
            setTxHash={setTxHash}
            setStatusMessage={setStatusMessage}
            isConnected={isConnected}
          />
          
          {slaExists && (
            <SelectWorker 
              slaId={selectedSLAId} 
              workerAddress={workerAddress} 
              setWorkerAddress={setWorkerAddress} 
              setTxHash={setTxHash}
              setStatusMessage={setStatusMessage}
              isConnected={isConnected}
              slaState={slaState}
              isManager={isManager}
            />
          )}
        </div>

        {/* Worker Actions */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '4px', margin: '0 0 4px 0' }}>
            Worker Actions
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', margin: '0 0 16px 0' }}>
            Submit bids on open SLAs
          </p>
          
          {slaExists ? (
            <SubmitBid 
              slaId={selectedSLAId} 
              form={bidForm} 
              setForm={setBidForm} 
              setTxHash={setTxHash}
              setStatusMessage={setStatusMessage}
              isConnected={isConnected}
              slaState={slaState}
              isManager={isManager}
            />
          ) : (
            <div style={{ color: '#64748b', fontSize: '14px', padding: '20px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '8px' }}>
              Select an existing SLA to submit a bid
            </div>
          )}
        </div>

        {/* Verifier Actions */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '4px', margin: '0 0 4px 0' }}>
            Verifier Actions
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', margin: '0 0 16px 0' }}>
            Stake to verify and approve/reject work
          </p>
          
          {slaExists ? (
            <>
              <StakeAsVerifier 
                slaId={selectedSLAId} 
                setTxHash={setTxHash}
                setStatusMessage={setStatusMessage}
                isConnected={isConnected}
                slaState={slaState}
                isManager={isManager}
                worker={worker}
                address={address}
              />
              <SubmitVerification 
                slaId={selectedSLAId} 
                setTxHash={setTxHash}
                setStatusMessage={setStatusMessage}
                isConnected={isConnected}
                slaState={slaState}
                isVerifier={isVerifier}
              />
            </>
          ) : (
            <div style={{ color: '#64748b', fontSize: '14px', padding: '20px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '8px' }}>
              Select an existing SLA to stake as verifier
            </div>
          )}
        </div>
      </div>

      {/* Transaction Status */}
      {(statusMessage || txHash) && (
        <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '16px' }}>
          {statusMessage && <div style={{ fontSize: '14px', color: '#0369a1', marginBottom: txHash ? '8px' : '0' }}><strong>Status:</strong> {statusMessage}</div>}
          {txHash && <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', wordBreak: 'break-all' }}><strong>Tx:</strong> {txHash}</div>}
        </div>
      )}
    </div>
  );
}

function MNEEBalance({ address }) {
  const { data: balance, isError, isLoading } = useContractRead({
    address: MNEE_TOKEN_ADDRESS,
    abi: MNEE_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
  });

  // DEBUG: Log token address, connected account, and balance
  console.log('[MNEE Debug]', {
    tokenAddress: MNEE_TOKEN_ADDRESS,
    connectedAccount: address,
    rawBalance: balance?.toString(),
    isError,
    isLoading,
    chainId: 31337
  });

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '500' }}>Your MNEE Balance</div>
      <div style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>
        {isLoading ? 'Loading...' : isError ? 'Error' : balance ? parseFloat(formatEther(balance)).toFixed(2) : '0.00'} MNEE
      </div>
      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', fontFamily: 'monospace' }}>
        Token: {MNEE_TOKEN_ADDRESS.slice(0, 10)}...
      </div>
    </div>
  );
}

function SLASelector({ selectedSLAId, setSelectedSLAId }) {
  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '500' }}>
        View SLA ID
      </label>
      <input 
        type="number" 
        value={selectedSLAId} 
        onChange={(e) => setSelectedSLAId(parseInt(e.target.value) || 0)}
        style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px', fontWeight: '600' }}
      />
    </div>
  );
}

function SLADetails({ slaId, slaData, address }) {
  if (!slaData || slaData[0] === ZeroAddress) {
    return (
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#64748b' }}>SLA #{slaId} does not exist. Create one or enter a valid ID.</div>
      </div>
    );
  }

  const [manager, worker, verifier1, verifier2, escrowAmount, verifierStake, state, decision1, decision2, description] = slaData;
  const isManager = manager.toLowerCase() === address?.toLowerCase();
  const isWorker = worker && worker !== ZeroAddress && worker.toLowerCase() === address?.toLowerCase();
  const isV1 = verifier1 && verifier1 !== ZeroAddress && verifier1.toLowerCase() === address?.toLowerCase();
  const isV2 = verifier2 && verifier2 !== ZeroAddress && verifier2.toLowerCase() === address?.toLowerCase();

  const formatAddr = (addr) => {
    if (!addr || addr === ZeroAddress) return '—';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0' }}>SLA #{slaId} Details</h3>
        {(isManager || isWorker || isV1 || isV2) && (
          <span style={{ fontSize: '11px', backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>
            You are: {isManager ? 'Manager' : isWorker ? 'Worker' : 'Verifier'}
          </span>
        )}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
        <div><div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Manager</div><div style={{ fontSize: '13px', fontFamily: 'monospace' }}>{formatAddr(manager)} {isManager && '(you)'}</div></div>
        <div><div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Worker</div><div style={{ fontSize: '13px', fontFamily: 'monospace' }}>{formatAddr(worker)} {isWorker && '(you)'}</div></div>
        <div><div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Verifier 1</div><div style={{ fontSize: '13px', fontFamily: 'monospace' }}>{formatAddr(verifier1)} {isV1 && '(you)'}</div></div>
        <div><div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Verifier 2</div><div style={{ fontSize: '13px', fontFamily: 'monospace' }}>{formatAddr(verifier2)} {isV2 && '(you)'}</div></div>
        <div><div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Escrow</div><div style={{ fontSize: '13px', fontWeight: '600' }}>{formatEther(escrowAmount)} MNEE</div></div>
        <div><div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Verifier Stake</div><div style={{ fontSize: '13px', fontWeight: '600' }}>{formatEther(verifierStake)} MNEE</div></div>
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

function CreateSLA({ form, setForm, setTxHash, setStatusMessage, isConnected }) {
  const { address } = useAccount();
  const [approvalPending, setApprovalPending] = useState(false);
  
  // Calculate required amount (escrow only - manager pays escrow, verifiers pay stake separately)
  const escrowAmountWei = form.escrowAmount ? parseEther(form.escrowAmount) : 0n;
  const verifierStakeWei = form.verifierStake ? parseEther(form.verifierStake) : 0n;
  const requiredAmount = escrowAmountWei; // Manager only needs to approve escrow amount
  
  // Read user's MNEE balance
  const { data: balance } = useContractRead({
    address: MNEE_TOKEN_ADDRESS,
    abi: MNEE_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
    enabled: Boolean(address),
  });

  // Read current allowance
  const { data: allowance, refetch: refetchAllowance } = useContractRead({
    address: MNEE_TOKEN_ADDRESS,
    abi: MNEE_TOKEN_ABI,
    functionName: 'allowance',
    args: [address, AGENT_SLA_ADDRESS],
    watch: true,
    enabled: Boolean(address),
  });

  // Check if approval is needed
  const needsApproval = requiredAmount > 0n && (allowance || 0n) < requiredAmount;
  const hasEnoughBalance = (balance || 0n) >= requiredAmount;
  const inputsValid = Boolean(form.escrowAmount && form.verifierStake && form.description);

  // DEBUG: Log allowance info
  console.log('[CreateSLA Debug]', {
    balance: balance?.toString(),
    allowance: allowance?.toString(),
    escrowAmount: escrowAmountWei.toString(),
    verifierStake: verifierStakeWei.toString(),
    requiredAmount: requiredAmount.toString(),
    needsApproval,
    hasEnoughBalance,
    inputsValid
  });

  // Prepare approve transaction (MAX_UINT256 for unlimited approval)
  const MAX_UINT256 = 2n ** 256n - 1n;
  const { config: approveConfig } = usePrepareContractWrite({
    address: MNEE_TOKEN_ADDRESS,
    abi: MNEE_TOKEN_ABI,
    functionName: 'approve',
    args: [AGENT_SLA_ADDRESS, MAX_UINT256],
    enabled: Boolean(isConnected && needsApproval && inputsValid),
  });

  const { write: writeApprove, isLoading: isApproving } = useContractWrite({
    ...approveConfig,
    onSuccess: async (data) => {
      setTxHash(data.hash);
      setStatusMessage('Approval submitted! Waiting for confirmation...');
      setApprovalPending(true);
      // Wait a bit then refetch allowance
      setTimeout(() => {
        refetchAllowance();
        setApprovalPending(false);
        setStatusMessage('Approval confirmed! You can now create the SLA.');
      }, 2000);
    },
    onError: (error) => {
      setStatusMessage(`Approval error: ${error.message}`);
      setApprovalPending(false);
    },
  });

  // Prepare createSLA transaction
  const { config: createConfig } = usePrepareContractWrite({
    address: AGENT_SLA_ADDRESS,
    abi: AGENT_SLA_ABI,
    functionName: 'createSLA',
    args: [escrowAmountWei, verifierStakeWei, form.description],
    enabled: Boolean(inputsValid && isConnected && !needsApproval && hasEnoughBalance),
  });

  const { write: writeCreate, isLoading: isCreating } = useContractWrite({
    ...createConfig,
    onSuccess: (data) => {
      setTxHash(data.hash);
      setStatusMessage('SLA created successfully!');
      setForm({ escrowAmount: '', verifierStake: '', description: '' });
    },
    onError: (error) => setStatusMessage(`Error: ${error.message}`),
  });

  const isLoading = isApproving || isCreating || approvalPending;

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '0 0 12px 0' }}>Create New SLA</h4>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>Lock MNEE as escrow for a new job posting.</p>
      
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

      {/* Insufficient balance warning */}
      {inputsValid && !hasEnoughBalance && (
        <div style={{ backgroundColor: '#fef2f2', padding: '8px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px', color: '#dc2626' }}>
          Insufficient MNEE balance. You need {form.escrowAmount} MNEE.
        </div>
      )}

      {/* Approval needed - show approve button */}
      {inputsValid && hasEnoughBalance && needsApproval && (
        <button 
          onClick={() => writeApprove?.()} 
          disabled={!writeApprove || isLoading}
          style={{ 
            width: '100%', 
            backgroundColor: (!writeApprove || isLoading) ? '#e5e7eb' : '#f59e0b', 
            color: (!writeApprove || isLoading) ? '#9ca3af' : '#fff',
            border: 'none', borderRadius: '6px', padding: '10px', fontSize: '14px', fontWeight: '600', 
            cursor: (!writeApprove || isLoading) ? 'not-allowed' : 'pointer',
            marginBottom: '8px'
          }}>
          {isApproving || approvalPending ? 'Approving...' : '1. Approve MNEE'}
        </button>
      )}
      
      {/* Create SLA button */}
      <button 
        onClick={() => writeCreate?.()} 
        disabled={!isConnected || !writeCreate || isLoading || !inputsValid || needsApproval || !hasEnoughBalance}
        style={{ 
          width: '100%', 
          backgroundColor: (!isConnected || !writeCreate || isLoading || !inputsValid || needsApproval || !hasEnoughBalance) ? '#e5e7eb' : '#3b82f6', 
          color: (!isConnected || !writeCreate || isLoading || !inputsValid || needsApproval || !hasEnoughBalance) ? '#9ca3af' : '#fff',
          border: 'none', borderRadius: '6px', padding: '10px', fontSize: '14px', fontWeight: '600', 
          cursor: (!isConnected || !writeCreate || isLoading || !inputsValid || needsApproval || !hasEnoughBalance) ? 'not-allowed' : 'pointer' 
        }}>
        {isCreating ? 'Creating...' : needsApproval ? '2. Create SLA (approve first)' : 'Create SLA'}
      </button>

      {/* Debug info */}
      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '8px', fontFamily: 'monospace' }}>
        Allowance: {allowance ? formatEther(allowance) : '0'} | Required: {form.escrowAmount || '0'}
      </div>
    </div>
  );
}

function SelectWorker({ slaId, workerAddress, setWorkerAddress, setTxHash, setStatusMessage, isConnected, slaState, isManager }) {
  const canAct = slaState === 0 && isManager;

  const { config } = usePrepareContractWrite({
    address: AGENT_SLA_ADDRESS,
    abi: AGENT_SLA_ABI,
    functionName: 'selectWorker',
    args: [slaId, workerAddress],
    enabled: Boolean(workerAddress && isAddress(workerAddress) && isConnected && canAct),
  });

  const { write, isLoading } = useContractWrite({
    ...config,
    onSuccess: (data) => {
      setTxHash(data.hash);
      setStatusMessage('Worker selected!');
      setWorkerAddress('');
    },
    onError: (error) => setStatusMessage(`Error: ${error.message}`),
  });

  const isDisabled = !isConnected || !write || isLoading || !workerAddress || !canAct;

  if (!isManager) {
    return (
      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#64748b' }}>Only the SLA manager can select a worker.</div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '0 0 12px 0' }}>Select Worker</h4>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>Choose a worker who submitted a bid.</p>
      
      {slaState !== 0 && (
        <div style={{ backgroundColor: '#fef3c7', padding: '8px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px', color: '#92400e' }}>
          Only available in CREATED state (current: {SLA_STATES[slaState]})
        </div>
      )}
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '4px' }}>Worker Address</label>
        <input type="text" value={workerAddress} onChange={(e) => setWorkerAddress(e.target.value)} disabled={!canAct}
          style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }} placeholder="0x..." />
      </div>
      
      <button onClick={() => write?.()} disabled={isDisabled}
        style={{ width: '100%', backgroundColor: isDisabled ? '#e5e7eb' : '#3b82f6', color: isDisabled ? '#9ca3af' : '#fff',
          border: 'none', borderRadius: '6px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: isDisabled ? 'not-allowed' : 'pointer' }}>
        {isLoading ? 'Selecting...' : slaState !== 0 ? 'Wrong State' : 'Select Worker'}
      </button>
    </div>
  );
}

function SubmitBid({ slaId, form, setForm, setTxHash, setStatusMessage, isConnected, slaState, isManager }) {
  const canAct = slaState === 0 && !isManager;

  const { config } = usePrepareContractWrite({
    address: AGENT_SLA_ADDRESS,
    abi: AGENT_SLA_ABI,
    functionName: 'submitBid',
    args: [slaId, form.bidAmount ? parseEther(form.bidAmount) : 0n],
    enabled: Boolean(form.bidAmount && isConnected && canAct),
  });

  const { write, isLoading } = useContractWrite({
    ...config,
    onSuccess: (data) => {
      setTxHash(data.hash);
      setStatusMessage('Bid submitted!');
      setForm({ bidAmount: '' });
    },
    onError: (error) => setStatusMessage(`Error: ${error.message}`),
  });

  const isDisabled = !isConnected || !write || isLoading || !form.bidAmount || !canAct;

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '0 0 12px 0' }}>Submit Bid</h4>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>Offer to complete the work for a specific amount.</p>
      
      {isManager && (
        <div style={{ backgroundColor: '#fef3c7', padding: '8px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px', color: '#92400e' }}>
          Managers cannot bid on their own SLAs.
        </div>
      )}
      
      {slaState !== 0 && !isManager && (
        <div style={{ backgroundColor: '#fef3c7', padding: '8px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px', color: '#92400e' }}>
          Bidding only available in CREATED state (current: {SLA_STATES[slaState]})
        </div>
      )}
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '4px' }}>Bid Amount (MNEE)</label>
        <input type="text" value={form.bidAmount} onChange={(e) => setForm({...form, bidAmount: e.target.value})} disabled={!canAct}
          style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} placeholder="80" />
      </div>
      
      <button onClick={() => write?.()} disabled={isDisabled}
        style={{ width: '100%', backgroundColor: isDisabled ? '#e5e7eb' : '#10b981', color: isDisabled ? '#9ca3af' : '#fff',
          border: 'none', borderRadius: '6px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: isDisabled ? 'not-allowed' : 'pointer' }}>
        {isLoading ? 'Submitting...' : !canAct ? (isManager ? 'Cannot Bid' : 'Wrong State') : 'Submit Bid'}
      </button>
    </div>
  );
}

function StakeAsVerifier({ slaId, setTxHash, setStatusMessage, isConnected, slaState, isManager, worker, address }) {
  const [approvalPending, setApprovalPending] = useState(false);
  const isWorker = worker && address && worker.toLowerCase() === address.toLowerCase();
  const canAct = slaState === 1 && !isManager && !isWorker;

  // Read SLA to get verifier stake amount
  const { data: slaData } = useContractRead({
    address: AGENT_SLA_ADDRESS,
    abi: AGENT_SLA_ABI,
    functionName: 'getSLA',
    args: [slaId],
    watch: true,
  });

  const verifierStake = slaData ? slaData[5] : 0n; // verifierStake is index 5

  // Read user's MNEE balance
  const { data: balance } = useContractRead({
    address: MNEE_TOKEN_ADDRESS,
    abi: MNEE_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
    enabled: Boolean(address),
  });

  // Read current allowance
  const { data: allowance, refetch: refetchAllowance } = useContractRead({
    address: MNEE_TOKEN_ADDRESS,
    abi: MNEE_TOKEN_ABI,
    functionName: 'allowance',
    args: [address, AGENT_SLA_ADDRESS],
    watch: true,
    enabled: Boolean(address),
  });

  const needsApproval = verifierStake > 0n && (allowance || 0n) < verifierStake;
  const hasEnoughBalance = (balance || 0n) >= verifierStake;

  // Prepare approve transaction
  const MAX_UINT256 = 2n ** 256n - 1n;
  const { config: approveConfig } = usePrepareContractWrite({
    address: MNEE_TOKEN_ADDRESS,
    abi: MNEE_TOKEN_ABI,
    functionName: 'approve',
    args: [AGENT_SLA_ADDRESS, MAX_UINT256],
    enabled: Boolean(isConnected && needsApproval && canAct),
  });

  const { write: writeApprove, isLoading: isApproving } = useContractWrite({
    ...approveConfig,
    onSuccess: async (data) => {
      setTxHash(data.hash);
      setStatusMessage('Approval submitted! Waiting for confirmation...');
      setApprovalPending(true);
      setTimeout(() => {
        refetchAllowance();
        setApprovalPending(false);
        setStatusMessage('Approval confirmed! You can now stake.');
      }, 2000);
    },
    onError: (error) => {
      setStatusMessage(`Approval error: ${error.message}`);
      setApprovalPending(false);
    },
  });

  const { config } = usePrepareContractWrite({
    address: AGENT_SLA_ADDRESS,
    abi: AGENT_SLA_ABI,
    functionName: 'stakeAsVerifier',
    args: [slaId],
    enabled: Boolean(isConnected && canAct && !needsApproval && hasEnoughBalance),
  });

  const { write, isLoading } = useContractWrite({
    ...config,
    onSuccess: (data) => {
      setTxHash(data.hash);
      setStatusMessage('Staked as verifier!');
    },
    onError: (error) => setStatusMessage(`Error: ${error.message}`),
  });

  const isLoadingAny = isLoading || isApproving || approvalPending;
  const isDisabled = !isConnected || !canAct;

  let blockReason = null;
  if (isManager) blockReason = 'Managers cannot verify their own SLAs.';
  else if (isWorker) blockReason = 'Workers cannot verify their own work.';
  else if (slaState !== 1) blockReason = `Staking only available in BIDDING state (current: ${SLA_STATES[slaState] || 'N/A'})`;

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '0 0 12px 0' }}>Stake as Verifier</h4>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>Lock {verifierStake ? formatEther(verifierStake) : '?'} MNEE to become a verifier. 2 verifiers required.</p>
      
      {blockReason && (
        <div style={{ backgroundColor: '#fef3c7', padding: '8px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px', color: '#92400e' }}>
          {blockReason}
        </div>
      )}

      {!blockReason && !hasEnoughBalance && (
        <div style={{ backgroundColor: '#fef2f2', padding: '8px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px', color: '#dc2626' }}>
          Insufficient MNEE balance. You need {verifierStake ? formatEther(verifierStake) : '?'} MNEE.
        </div>
      )}

      {!blockReason && hasEnoughBalance && needsApproval && (
        <button 
          onClick={() => writeApprove?.()} 
          disabled={!writeApprove || isLoadingAny}
          style={{ 
            width: '100%', 
            backgroundColor: (!writeApprove || isLoadingAny) ? '#e5e7eb' : '#f59e0b', 
            color: (!writeApprove || isLoadingAny) ? '#9ca3af' : '#fff',
            border: 'none', borderRadius: '6px', padding: '10px', fontSize: '14px', fontWeight: '600', 
            cursor: (!writeApprove || isLoadingAny) ? 'not-allowed' : 'pointer',
            marginBottom: '8px'
          }}>
          {isApproving || approvalPending ? 'Approving...' : '1. Approve MNEE'}
        </button>
      )}
      
      <button onClick={() => write?.()} disabled={isDisabled || !write || isLoadingAny || needsApproval || !hasEnoughBalance || blockReason}
        style={{ width: '100%', backgroundColor: (isDisabled || !write || isLoadingAny || needsApproval || !hasEnoughBalance || blockReason) ? '#e5e7eb' : '#8b5cf6', color: (isDisabled || !write || isLoadingAny || needsApproval || !hasEnoughBalance || blockReason) ? '#9ca3af' : '#fff',
          border: 'none', borderRadius: '6px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: (isDisabled || !write || isLoadingAny || needsApproval || !hasEnoughBalance || blockReason) ? 'not-allowed' : 'pointer' }}>
        {isLoading ? 'Staking...' : blockReason ? 'Cannot Stake' : needsApproval ? '2. Stake as Verifier (approve first)' : 'Stake as Verifier'}
      </button>

      {!blockReason && (
        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '8px', fontFamily: 'monospace' }}>
          Allowance: {allowance ? formatEther(allowance) : '0'} | Required: {verifierStake ? formatEther(verifierStake) : '0'}
        </div>
      )}
    </div>
  );
}

function SubmitVerification({ slaId, setTxHash, setStatusMessage, isConnected, slaState, isVerifier }) {
  const [decision, setDecision] = useState('');
  const canAct = slaState === 2 && isVerifier;

  const { config } = usePrepareContractWrite({
    address: AGENT_SLA_ADDRESS,
    abi: AGENT_SLA_ABI,
    functionName: 'submitVerification',
    args: [slaId, decision === 'approve' ? 1 : 2],
    enabled: Boolean(decision && isConnected && canAct),
  });

  const { write, isLoading } = useContractWrite({
    ...config,
    onSuccess: (data) => {
      setTxHash(data.hash);
      setStatusMessage(`Verification ${decision}d!`);
      setDecision('');
    },
    onError: (error) => setStatusMessage(`Error: ${error.message}`),
  });

  const isDisabled = !isConnected || !write || isLoading || !decision || !canAct;

  let blockReason = null;
  if (!isVerifier && slaState === 2) blockReason = 'Only staked verifiers can submit decisions.';
  else if (slaState !== 2) blockReason = `Verification only in VERIFYING state (current: ${SLA_STATES[slaState] || 'N/A'})`;

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '0 0 12px 0' }}>Submit Verification</h4>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>Approve or reject the completed work.</p>
      
      {blockReason && (
        <div style={{ backgroundColor: '#fef3c7', padding: '8px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px', color: '#92400e' }}>
          {blockReason}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <label style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '10px', border: decision === 'approve' ? '2px solid #10b981' : '1px solid #d1d5db',
          borderRadius: '6px', backgroundColor: decision === 'approve' ? '#ecfdf5' : '#fff', cursor: canAct ? 'pointer' : 'not-allowed', opacity: canAct ? 1 : 0.6 }}>
          <input type="radio" value="approve" checked={decision === 'approve'} onChange={(e) => setDecision(e.target.value)} disabled={!canAct} style={{ marginRight: '6px' }} />
          <span style={{ fontSize: '13px', fontWeight: '500', color: decision === 'approve' ? '#059669' : '#374151' }}>Approve</span>
        </label>
        <label style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '10px', border: decision === 'reject' ? '2px solid #ef4444' : '1px solid #d1d5db',
          borderRadius: '6px', backgroundColor: decision === 'reject' ? '#fef2f2' : '#fff', cursor: canAct ? 'pointer' : 'not-allowed', opacity: canAct ? 1 : 0.6 }}>
          <input type="radio" value="reject" checked={decision === 'reject'} onChange={(e) => setDecision(e.target.value)} disabled={!canAct} style={{ marginRight: '6px' }} />
          <span style={{ fontSize: '13px', fontWeight: '500', color: decision === 'reject' ? '#dc2626' : '#374151' }}>Reject</span>
        </label>
      </div>
      
      <button onClick={() => write?.()} disabled={isDisabled}
        style={{ width: '100%', backgroundColor: isDisabled ? '#e5e7eb' : '#6366f1', color: isDisabled ? '#9ca3af' : '#fff',
          border: 'none', borderRadius: '6px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: isDisabled ? 'not-allowed' : 'pointer' }}>
        {isLoading ? 'Submitting...' : blockReason ? 'Cannot Submit' : 'Submit Decision'}
      </button>
    </div>
  );
}

export default AgentSLAInterface;
