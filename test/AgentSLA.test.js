const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentSLA", function () {
  let agentSLA;
  let mneeToken;
  let manager, worker, verifier1, verifier2;
  
  const ESCROW_AMOUNT = ethers.utils.parseEther("100");
  const VERIFIER_STAKE = ethers.utils.parseEther("10");
  const BID_AMOUNT = ethers.utils.parseEther("80");
  const DESCRIPTION = "Test SLA for AI agent work";

  beforeEach(async function () {
    [manager, worker, verifier1, verifier2] = await ethers.getSigners();

    // Deploy mock MNEE token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mneeToken = await MockERC20.deploy("MNEE Token", "MNEE", ethers.utils.parseEther("10000"));
    
    // Deploy AgentSLA contract
    const AgentSLA = await ethers.getContractFactory("AgentSLA");
    agentSLA = await AgentSLA.deploy(mneeToken.address);

    // Distribute tokens to all participants
    await mneeToken.transfer(manager.address, ethers.utils.parseEther("1000"));
    await mneeToken.transfer(worker.address, ethers.utils.parseEther("1000"));
    await mneeToken.transfer(verifier1.address, ethers.utils.parseEther("1000"));
    await mneeToken.transfer(verifier2.address, ethers.utils.parseEther("1000"));

    // Approve contract to spend tokens
    await mneeToken.connect(manager).approve(agentSLA.address, ethers.constants.MaxUint256);
    await mneeToken.connect(verifier1).approve(agentSLA.address, ethers.constants.MaxUint256);
    await mneeToken.connect(verifier2).approve(agentSLA.address, ethers.constants.MaxUint256);
  });

  describe("SLA Creation and Escrow Locking", function () {
    it("Should create SLA and lock manager's escrow", async function () {
      const managerBalanceBefore = await mneeToken.balanceOf(manager.address);
      const contractBalanceBefore = await mneeToken.balanceOf(agentSLA.address);

      await expect(
        agentSLA.connect(manager).createSLA(ESCROW_AMOUNT, VERIFIER_STAKE, DESCRIPTION)
      ).to.emit(agentSLA, "SLACreated")
        .withArgs(0, manager.address, ESCROW_AMOUNT, VERIFIER_STAKE, DESCRIPTION);

      // Check escrow is locked
      const managerBalanceAfter = await mneeToken.balanceOf(manager.address);
      const contractBalanceAfter = await mneeToken.balanceOf(agentSLA.address);
      
      expect(managerBalanceAfter).to.equal(managerBalanceBefore.sub(ESCROW_AMOUNT));
      expect(contractBalanceAfter).to.equal(contractBalanceBefore.add(ESCROW_AMOUNT));

      // Check SLA state
      const sla = await agentSLA.getSLA(0);
      expect(sla.manager).to.equal(manager.address);
      expect(sla.escrowAmount).to.equal(ESCROW_AMOUNT);
      expect(sla.verifierStake).to.equal(VERIFIER_STAKE);
      expect(sla.state).to.equal(0); // CREATED
    });
  });

  describe("Bidding and Worker Selection", function () {
    beforeEach(async function () {
      await agentSLA.connect(manager).createSLA(ESCROW_AMOUNT, VERIFIER_STAKE, DESCRIPTION);
    });

    it("Should allow worker to submit bid and manager to select worker", async function () {
      // Worker submits bid
      await expect(
        agentSLA.connect(worker).submitBid(0, BID_AMOUNT)
      ).to.emit(agentSLA, "BidSubmitted")
        .withArgs(0, worker.address, BID_AMOUNT);

      // Check bid is recorded
      expect(await agentSLA.getBid(0, worker.address)).to.equal(BID_AMOUNT);

      // Manager selects worker
      await expect(
        agentSLA.connect(manager).selectWorker(0, worker.address)
      ).to.emit(agentSLA, "WorkerSelected")
        .withArgs(0, worker.address, BID_AMOUNT);

      // Check SLA state updated
      const sla = await agentSLA.getSLA(0);
      expect(sla.worker).to.equal(worker.address);
      expect(sla.state).to.equal(1); // BIDDING
    });
  });

  describe("Verifier Staking and Approval Flow", function () {
    beforeEach(async function () {
      await agentSLA.connect(manager).createSLA(ESCROW_AMOUNT, VERIFIER_STAKE, DESCRIPTION);
      await agentSLA.connect(worker).submitBid(0, BID_AMOUNT);
      await agentSLA.connect(manager).selectWorker(0, worker.address);
    });

    it("Should allow two verifiers to stake and both approve → worker gets paid", async function () {
      const workerBalanceBefore = await mneeToken.balanceOf(worker.address);
      const managerBalanceBefore = await mneeToken.balanceOf(manager.address);
      const verifier1BalanceBefore = await mneeToken.balanceOf(verifier1.address);
      const verifier2BalanceBefore = await mneeToken.balanceOf(verifier2.address);

      // First verifier stakes
      await expect(
        agentSLA.connect(verifier1).stakeAsVerifier(0)
      ).to.emit(agentSLA, "VerifierStaked")
        .withArgs(0, verifier1.address, true);

      // Second verifier stakes (should transition to VERIFYING)
      await expect(
        agentSLA.connect(verifier2).stakeAsVerifier(0)
      ).to.emit(agentSLA, "VerifierStaked")
        .withArgs(0, verifier2.address, false);

      // Check state is VERIFYING
      let sla = await agentSLA.getSLA(0);
      expect(sla.state).to.equal(2); // VERIFYING

      // Both verifiers approve
      await expect(
        agentSLA.connect(verifier1).submitVerification(0, 1) // APPROVE
      ).to.emit(agentSLA, "VerificationSubmitted")
        .withArgs(0, verifier1.address, 1);

      await expect(
        agentSLA.connect(verifier2).submitVerification(0, 1) // APPROVE
      ).to.emit(agentSLA, "SLAResolved")
        .withArgs(0, worker.address, true, ethers.constants.AddressZero, 0);

      // Check final state
      sla = await agentSLA.getSLA(0);
      expect(sla.state).to.equal(3); // RESOLVED

      // Check payments
      const workerBalanceAfter = await mneeToken.balanceOf(worker.address);
      const managerBalanceAfter = await mneeToken.balanceOf(manager.address);
      const verifier1BalanceAfter = await mneeToken.balanceOf(verifier1.address);
      const verifier2BalanceAfter = await mneeToken.balanceOf(verifier2.address);

      // Worker gets bid amount
      expect(workerBalanceAfter).to.equal(workerBalanceBefore.add(BID_AMOUNT));
      
      // Manager gets remaining escrow back
      const remainingEscrow = ESCROW_AMOUNT.sub(BID_AMOUNT);
      expect(managerBalanceAfter).to.equal(managerBalanceBefore.add(remainingEscrow));
      
      // Verifiers get their stakes back
      expect(verifier1BalanceAfter).to.equal(verifier1BalanceBefore);
      expect(verifier2BalanceAfter).to.equal(verifier2BalanceBefore);
    });

    it("Should slash minority verifier when verifiers disagree", async function () {
      const managerBalanceBefore = await mneeToken.balanceOf(manager.address);
      const verifier1BalanceBefore = await mneeToken.balanceOf(verifier1.address);
      const verifier2BalanceBefore = await mneeToken.balanceOf(verifier2.address);

      // Both verifiers stake
      await agentSLA.connect(verifier1).stakeAsVerifier(0);
      await agentSLA.connect(verifier2).stakeAsVerifier(0);

      // Verifiers disagree (verifier1 approves, verifier2 rejects)
      await agentSLA.connect(verifier1).submitVerification(0, 1); // APPROVE
      
      // Determine which verifier will be slashed based on address comparison
      const sla = await agentSLA.getSLA(0);
      const slashedVerifier = verifier1.address.toLowerCase() < verifier2.address.toLowerCase() 
        ? verifier1.address 
        : verifier2.address;
      const nonSlashedVerifier = slashedVerifier === verifier1.address 
        ? verifier2.address 
        : verifier1.address;

      await expect(
        agentSLA.connect(verifier2).submitVerification(0, 2) // REJECT
      ).to.emit(agentSLA, "SLAResolved")
        .withArgs(0, worker.address, false, slashedVerifier, VERIFIER_STAKE);

      // Check SLA is resolved as rejected
      const finalSLA = await agentSLA.getSLA(0);
      expect(finalSLA.state).to.equal(3); // RESOLVED

      // Check payments
      const managerBalanceAfter = await mneeToken.balanceOf(manager.address);
      const verifier1BalanceAfter = await mneeToken.balanceOf(verifier1.address);
      const verifier2BalanceAfter = await mneeToken.balanceOf(verifier2.address);

      // Manager gets full escrow back (work rejected)
      expect(managerBalanceAfter).to.equal(managerBalanceBefore.add(ESCROW_AMOUNT));

      // Non-slashed verifier gets stake back, slashed verifier loses stake
      if (slashedVerifier === verifier1.address) {
        expect(verifier1BalanceAfter).to.equal(verifier1BalanceBefore.sub(VERIFIER_STAKE));
        expect(verifier2BalanceAfter).to.equal(verifier2BalanceBefore);
      } else {
        expect(verifier1BalanceAfter).to.equal(verifier1BalanceBefore);
        expect(verifier2BalanceAfter).to.equal(verifier2BalanceBefore.sub(VERIFIER_STAKE));
      }
    });
  });
});