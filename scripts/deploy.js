const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts to Hardhat local network...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy MockERC20 as MNEE token
  console.log("\n1. Deploying MockERC20 as MNEE token...");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const initialSupply = hre.ethers.parseEther("1000000"); // 1 million MNEE
  const mneeToken = await MockERC20.deploy("MNEE Token", "MNEE", initialSupply);
  await mneeToken.waitForDeployment();
  const mneeAddress = await mneeToken.getAddress();
  console.log("MNEE Token deployed to:", mneeAddress);

  // Deploy AgentSLA contract
  console.log("\n2. Deploying AgentSLA contract...");
  const AgentSLA = await hre.ethers.getContractFactory("AgentSLA");
  const agentSLA = await AgentSLA.deploy(mneeAddress);
  await agentSLA.waitForDeployment();
  const agentSLAAddress = await agentSLA.getAddress();
  console.log("AgentSLA deployed to:", agentSLAAddress);

  // Output config for frontend
  console.log("\n========================================");
  console.log("UPDATE src/contracts/config.js WITH:");
  console.log("========================================");
  console.log(`export const AGENT_SLA_ADDRESS = '${agentSLAAddress}';`);
  console.log(`export const MNEE_TOKEN_ADDRESS = '${mneeAddress}';`);
  console.log("========================================\n");

  // Auto-update config.js with new addresses
  const fs = require('fs');
  const configPath = './src/contracts/config.js';
  let configContent = fs.readFileSync(configPath, 'utf8');
  configContent = configContent.replace(
    /export const AGENT_SLA_ADDRESS = '[^']+';/,
    `export const AGENT_SLA_ADDRESS = '${agentSLAAddress}';`
  );
  configContent = configContent.replace(
    /export const MNEE_TOKEN_ADDRESS = '[^']+';/,
    `export const MNEE_TOKEN_ADDRESS = '${mneeAddress}';`
  );
  fs.writeFileSync(configPath, configContent);
  console.log("✅ Auto-updated src/contracts/config.js with new addresses!\n");

  // Mint some MNEE to test accounts
  console.log("3. Minting MNEE to test accounts...");
  const accounts = await hre.ethers.getSigners();
  const mintAmount = hre.ethers.parseEther("10000"); // 10k MNEE each
  
  for (let i = 0; i < Math.min(5, accounts.length); i++) {
    await mneeToken.mint(accounts[i].address, mintAmount);
    console.log(`   Minted 10,000 MNEE to account ${i}: ${accounts[i].address}`);
  }

  console.log("\n✅ Deployment complete!");
  console.log("\nNext steps:");
  console.log("1. Update src/contracts/config.js with the addresses above");
  console.log("2. Add Hardhat network to MetaMask (chainId: 31337, RPC: http://127.0.0.1:8545)");
  console.log("3. Import a Hardhat test account to MetaMask using its private key");
  console.log("4. Run 'npm start' to start the frontend\n");

  return { mneeAddress, agentSLAAddress };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
