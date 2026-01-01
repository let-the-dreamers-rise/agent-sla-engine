import { useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { formatEther, parseEther, isAddress, ZeroAddress } from 'ethers';
import { AGENT_SLA_ABI, AGENT_SLA_ADDRESS, MNEE_TOKEN_ABI, MNEE_TOKEN_ADDRESS } from '../contracts/config';

// Hook for reading SLA data
export function useSLA(slaId) {
  const { data: slaData, isLoading, error } = useContractRead({
    address: AGENT_SLA_ADDRESS,
    abi: AGENT_SLA_ABI,
    functionName: 'getSLA',
    args: [slaId],
    watch: true,
  });

  return {
    sla: slaData,
    isLoading,
    error,
    exists: slaData && slaData.manager !== ZeroAddress
  };
}

// Hook for reading MNEE balance
export function useMNEEBalance(address) {
  const { data: balance, isLoading } = useContractRead({
    address: MNEE_TOKEN_ADDRESS,
    abi: MNEE_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
    enabled: Boolean(address),
  });

  return {
    balance: balance ? formatEther(balance) : '0',
    balanceWei: balance,
    isLoading
  };
}

// Hook for reading bid amount
export function useBid(slaId, workerAddress) {
  const { data: bidAmount } = useContractRead({
    address: AGENT_SLA_ADDRESS,
    abi: AGENT_SLA_ABI,
    functionName: 'getBid',
    args: [slaId, workerAddress],
    watch: true,
    enabled: Boolean(workerAddress && isAddress(workerAddress)),
  });

  return {
    bidAmount: bidAmount ? formatEther(bidAmount) : '0',
    bidAmountWei: bidAmount
  };
}


// Hook for creating SLA
export function useCreateSLA() {
  return function(escrowAmount, verifierStake, description, onSuccess) {
    const { config } = usePrepareContractWrite({
      address: AGENT_SLA_ADDRESS,
      abi: AGENT_SLA_ABI,
      functionName: 'createSLA',
      args: [
        parseEther(escrowAmount || '0'),
        parseEther(verifierStake || '0'),
        description || ''
      ],
      enabled: Boolean(escrowAmount && verifierStake && description),
    });

    const { write, isLoading, error } = useContractWrite({
      ...config,
      onSuccess: onSuccess,
    });

    return { write, isLoading, error };
  };
}

// Hook for submitting bid
export function useSubmitBid() {
  return function(slaId, bidAmount, onSuccess) {
    const { config } = usePrepareContractWrite({
      address: AGENT_SLA_ADDRESS,
      abi: AGENT_SLA_ABI,
      functionName: 'submitBid',
      args: [slaId, parseEther(bidAmount || '0')],
      enabled: Boolean(bidAmount),
    });

    const { write, isLoading, error } = useContractWrite({
      ...config,
      onSuccess: onSuccess,
    });

    return { write, isLoading, error };
  };
}

// Hook for selecting worker
export function useSelectWorker() {
  return function(slaId, workerAddress, onSuccess) {
    const { config } = usePrepareContractWrite({
      address: AGENT_SLA_ADDRESS,
      abi: AGENT_SLA_ABI,
      functionName: 'selectWorker',
      args: [slaId, workerAddress],
      enabled: Boolean(workerAddress && isAddress(workerAddress)),
    });

    const { write, isLoading, error } = useContractWrite({
      ...config,
      onSuccess: onSuccess,
    });

    return { write, isLoading, error };
  };
}

// Hook for staking as verifier
export function useStakeAsVerifier() {
  return function(slaId, onSuccess) {
    const { config } = usePrepareContractWrite({
      address: AGENT_SLA_ADDRESS,
      abi: AGENT_SLA_ABI,
      functionName: 'stakeAsVerifier',
      args: [slaId],
    });

    const { write, isLoading, error } = useContractWrite({
      ...config,
      onSuccess: onSuccess,
    });

    return { write, isLoading, error };
  };
}

// Hook for submitting verification
export function useSubmitVerification() {
  return function(slaId, decision, onSuccess) {
    const decisionValue = decision === 'approve' ? 1 : 2;
    
    const { config } = usePrepareContractWrite({
      address: AGENT_SLA_ADDRESS,
      abi: AGENT_SLA_ABI,
      functionName: 'submitVerification',
      args: [slaId, decisionValue],
      enabled: Boolean(decision),
    });

    const { write, isLoading, error } = useContractWrite({
      ...config,
      onSuccess: onSuccess,
    });

    return { write, isLoading, error };
  };
}

// Hook for approving MNEE tokens
export function useApproveMNEE() {
  return function(amount, onSuccess) {
    const { config } = usePrepareContractWrite({
      address: MNEE_TOKEN_ADDRESS,
      abi: MNEE_TOKEN_ABI,
      functionName: 'approve',
      args: [AGENT_SLA_ADDRESS, parseEther(amount || '0')],
      enabled: Boolean(amount),
    });

    const { write, isLoading, error } = useContractWrite({
      ...config,
      onSuccess: onSuccess,
    });

    return { write, isLoading, error };
  };
}
