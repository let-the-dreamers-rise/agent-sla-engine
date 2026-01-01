// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentSLA
 * @dev Autonomous SLA Engine for AI Agents using MNEE tokens as escrow and verifier collateral
 * @notice This contract manages the complete lifecycle of Service Level Agreements between managers and workers,
 *         with a two-verifier system for dispute resolution and automatic slashing mechanisms.
 */
contract AgentSLA is ReentrancyGuard {
    // MNEE token interface
    IERC20 public immutable mneeToken;
    
    // SLA lifecycle states
    enum SLAState { CREATED, BIDDING, VERIFYING, RESOLVED }
    
    // Verifier decision enum
    enum VerifierDecision { PENDING, APPROVE, REJECT }
    
    /**
     * @dev Core SLA structure containing all necessary data
     * @param manager Address of the SLA creator who locks escrow
     * @param worker Address of the selected worker (set during bid selection)
     * @param verifier1 Address of the first verifier
     * @param verifier2 Address of the second verifier
     * @param escrowAmount Amount of MNEE tokens locked by manager as payment
     * @param verifierStake Amount each verifier must stake (set at creation)
     * @param state Current lifecycle state of the SLA
     * @param decision1 First verifier's decision (PENDING/APPROVE/REJECT)
     * @param decision2 Second verifier's decision (PENDING/APPROVE/REJECT)
     * @param description IPFS hash or description of work requirements
     */
    struct SLA {
        address manager;
        address worker;
        address verifier1;
        address verifier2;
        uint256 escrowAmount;
        uint256 verifierStake;
        SLAState state;
        VerifierDecision decision1;
        VerifierDecision decision2;
        string description;
    }
    
    // Storage
    mapping(uint256 => SLA) public slas;
    mapping(uint256 => mapping(address => uint256)) public bids; // slaId => worker => bidAmount
    uint256 public nextSLAId;
    
    // Events for state transitions and key actions
    event SLACreated(uint256 indexed slaId, address indexed manager, uint256 escrowAmount, uint256 verifierStake, string description);
    event BidSubmitted(uint256 indexed slaId, address indexed worker, uint256 bidAmount);
    event WorkerSelected(uint256 indexed slaId, address indexed worker, uint256 acceptedBid);
    event VerifierStaked(uint256 indexed slaId, address indexed verifier, bool isFirstVerifier);
    event VerificationSubmitted(uint256 indexed slaId, address indexed verifier, VerifierDecision decision);
    event SLAResolved(uint256 indexed slaId, address indexed worker, bool approved, address slashedVerifier, uint256 slashAmount);
    
    /**
     * @dev Constructor sets the MNEE token address
     * @param _mneeToken Address of the MNEE ERC-20 token contract
     */
    constructor(address _mneeToken) {
        require(_mneeToken != address(0), "Invalid MNEE token address");
        mneeToken = IERC20(_mneeToken);
    }
    
    /**
     * @dev Creates a new SLA with escrow and verifier stake requirements
     * @param _escrowAmount Amount of MNEE tokens to lock as payment for worker
     * @param _verifierStake Amount each verifier must stake for participation
     * @param _description IPFS hash or description of work requirements
     * @return slaId The unique identifier for the created SLA
     */
    function createSLA(
        uint256 _escrowAmount,
        uint256 _verifierStake,
        string calldata _description
    ) external returns (uint256 slaId) {
        require(_escrowAmount > 0, "Escrow amount must be positive");
        require(_verifierStake > 0, "Verifier stake must be positive");
        require(bytes(_description).length > 0, "Description required");
        
        // Transfer escrow from manager to contract
        require(mneeToken.transferFrom(msg.sender, address(this), _escrowAmount), "Escrow transfer failed");
        
        slaId = nextSLAId++;
        
        slas[slaId] = SLA({
            manager: msg.sender,
            worker: address(0),
            verifier1: address(0),
            verifier2: address(0),
            escrowAmount: _escrowAmount,
            verifierStake: _verifierStake,
            state: SLAState.CREATED,
            decision1: VerifierDecision.PENDING,
            decision2: VerifierDecision.PENDING,
            description: _description
        });
        
        emit SLACreated(slaId, msg.sender, _escrowAmount, _verifierStake, _description);
    }
    
    /**
     * @dev Allows workers to submit bids for an SLA in CREATED state
     * @param _slaId The SLA identifier to bid on
     * @param _bidAmount The amount the worker is willing to accept for the work
     */
    function submitBid(uint256 _slaId, uint256 _bidAmount) external {
        SLA storage sla = slas[_slaId];
        require(sla.state == SLAState.CREATED, "SLA not in CREATED state");
        require(sla.manager != address(0), "SLA does not exist");
        require(msg.sender != sla.manager, "Manager cannot bid");
        require(_bidAmount > 0, "Bid amount must be positive");
        require(_bidAmount <= sla.escrowAmount, "Bid exceeds escrow");
        
        bids[_slaId][msg.sender] = _bidAmount;
        
        emit BidSubmitted(_slaId, msg.sender, _bidAmount);
    }
    
    /**
     * @dev Manager selects a worker from submitted bids, transitions to BIDDING state
     * @param _slaId The SLA identifier
     * @param _worker Address of the selected worker
     */
    function selectWorker(uint256 _slaId, address _worker) external {
        SLA storage sla = slas[_slaId];
        require(msg.sender == sla.manager, "Only manager can select worker");
        require(sla.state == SLAState.CREATED, "SLA not in CREATED state");
        require(bids[_slaId][_worker] > 0, "Worker has not submitted a bid");
        
        sla.worker = _worker;
        sla.state = SLAState.BIDDING;
        
        emit WorkerSelected(_slaId, _worker, bids[_slaId][_worker]);
    }
    
    /**
     * @dev Allows verifiers to stake MNEE and join the verification process
     * @param _slaId The SLA identifier to verify
     */
    function stakeAsVerifier(uint256 _slaId) external {
        SLA storage sla = slas[_slaId];
        require(sla.state == SLAState.BIDDING, "SLA not in BIDDING state");
        require(msg.sender != sla.manager && msg.sender != sla.worker, "Manager/worker cannot verify");
        require(sla.verifier1 == address(0) || sla.verifier2 == address(0), "Both verifier slots filled");
        require(sla.verifier1 != msg.sender, "Already a verifier");
        
        // Transfer verifier stake to contract
        require(mneeToken.transferFrom(msg.sender, address(this), sla.verifierStake), "Stake transfer failed");
        
        bool isFirstVerifier;
        if (sla.verifier1 == address(0)) {
            sla.verifier1 = msg.sender;
            isFirstVerifier = true;
        } else {
            sla.verifier2 = msg.sender;
            isFirstVerifier = false;
            // Both verifiers staked, move to VERIFYING state
            sla.state = SLAState.VERIFYING;
        }
        
        emit VerifierStaked(_slaId, msg.sender, isFirstVerifier);
    }
    
    /**
     * @dev Verifiers submit their approval/rejection decision
     * @param _slaId The SLA identifier to verify
     * @param _decision The verifier's decision (APPROVE or REJECT)
     */
    function submitVerification(uint256 _slaId, VerifierDecision _decision) external nonReentrant {
        SLA storage sla = slas[_slaId];
        require(sla.state == SLAState.VERIFYING, "SLA not in VERIFYING state");
        require(_decision == VerifierDecision.APPROVE || _decision == VerifierDecision.REJECT, "Invalid decision");
        
        if (msg.sender == sla.verifier1) {
            require(sla.decision1 == VerifierDecision.PENDING, "Decision already submitted");
            sla.decision1 = _decision;
        } else if (msg.sender == sla.verifier2) {
            require(sla.decision2 == VerifierDecision.PENDING, "Decision already submitted");
            sla.decision2 = _decision;
        } else {
            revert("Not a verifier for this SLA");
        }
        
        emit VerificationSubmitted(_slaId, msg.sender, _decision);
        
        // Check if both verifiers have decided and resolve if so
        if (sla.decision1 != VerifierDecision.PENDING && sla.decision2 != VerifierDecision.PENDING) {
            _resolveSLA(_slaId);
        }
    }
    
    /**
     * @dev Internal function to resolve SLA based on verifier decisions
     * @param _slaId The SLA identifier to resolve
     */
    function _resolveSLA(uint256 _slaId) internal {
        SLA storage sla = slas[_slaId];
        require(sla.state == SLAState.VERIFYING, "SLA not in VERIFYING state");
        
        sla.state = SLAState.RESOLVED;
        
        bool approved;
        address slashedVerifier = address(0);
        uint256 slashAmount = 0;
        
        if (sla.decision1 == sla.decision2) {
            // Both verifiers agree
            approved = (sla.decision1 == VerifierDecision.APPROVE);
            
            if (approved) {
                // Pay worker the bid amount
                uint256 workerPayment = bids[_slaId][sla.worker];
                require(mneeToken.transfer(sla.worker, workerPayment), "Worker payment failed");
                
                // Return remaining escrow to manager
                uint256 remainingEscrow = sla.escrowAmount - workerPayment;
                if (remainingEscrow > 0) {
                    require(mneeToken.transfer(sla.manager, remainingEscrow), "Manager refund failed");
                }
            } else {
                // Return full escrow to manager
                require(mneeToken.transfer(sla.manager, sla.escrowAmount), "Manager refund failed");
            }
            
            // Return stakes to both verifiers
            require(mneeToken.transfer(sla.verifier1, sla.verifierStake), "Verifier1 stake return failed");
            require(mneeToken.transfer(sla.verifier2, sla.verifierStake), "Verifier2 stake return failed");
            
        } else {
            // Verifiers disagree - slash minority, resolve as rejected
            approved = false;
            
            // Return full escrow to manager
            require(mneeToken.transfer(sla.manager, sla.escrowAmount), "Manager refund failed");
            
            // Determine slashed verifier fairly based on address comparison
            // Lower address gets slashed to make it unpredictable but deterministic
            if (sla.verifier1 < sla.verifier2) {
                slashedVerifier = sla.verifier1;
                // Return stake to non-slashed verifier
                require(mneeToken.transfer(sla.verifier2, sla.verifierStake), "Verifier2 stake return failed");
            } else {
                slashedVerifier = sla.verifier2;
                // Return stake to non-slashed verifier
                require(mneeToken.transfer(sla.verifier1, sla.verifierStake), "Verifier1 stake return failed");
            }
            slashAmount = sla.verifierStake;
            
            // Slashed verifier's stake remains in contract (could be sent to treasury or burned)
        }
        
        emit SLAResolved(_slaId, sla.worker, approved, slashedVerifier, slashAmount);
    }
    
    /**
     * @dev View function to get SLA details
     * @param _slaId The SLA identifier
     * @return manager The manager address
     * @return worker The worker address
     * @return verifier1 First verifier address
     * @return verifier2 Second verifier address
     * @return escrowAmount Amount locked in escrow
     * @return verifierStake Required verifier stake
     * @return state Current SLA state
     * @return decision1 First verifier decision
     * @return decision2 Second verifier decision
     * @return description SLA description
     */
    function getSLA(uint256 _slaId) external view returns (
        address manager,
        address worker,
        address verifier1,
        address verifier2,
        uint256 escrowAmount,
        uint256 verifierStake,
        SLAState state,
        VerifierDecision decision1,
        VerifierDecision decision2,
        string memory description
    ) {
        SLA storage sla = slas[_slaId];
        return (
            sla.manager,
            sla.worker,
            sla.verifier1,
            sla.verifier2,
            sla.escrowAmount,
            sla.verifierStake,
            sla.state,
            sla.decision1,
            sla.decision2,
            sla.description
        );
    }
    
    /**
     * @dev View function to get a worker's bid for an SLA
     * @param _slaId The SLA identifier
     * @param _worker The worker's address
     * @return The bid amount
     */
    function getBid(uint256 _slaId, address _worker) external view returns (uint256) {
        return bids[_slaId][_worker];
    }
}