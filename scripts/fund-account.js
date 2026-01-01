const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // Read current config to get deployed token address
  const configPath = './src/contracts/config.js';
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  const mneeMatch = configContent.match(/MNEE_TOKEN_ADDRESS = '([^']+)'/);
  if (!mneeMatch) {
    console.error("Could not find MNEE_TOKEN_ADDRESS in config.js");
    console.error("Run 'npx hardhat run scripts/deploy.js --network localhost' first");
    process.exit(1);
  }
  
  const MNEE_TOKEN_ADDRESS = mneeMatch[1];
  console.log("Using MNEE Token at:", MNEE_TOKEN_ADDRESS);

  // Get the target address from environment variable
  const targetAddress = process.env.TARGET_ADDRESS;
  
  const [deployer] = await hre.ethers.getSigners();
  
  // Get MockERC20 contract
  const mneeToken = await hre.ethers.getContractAt("MockERC20", MNEE_TOKEN_ADDRESS);
  
  const mintAmount = hre.ethers.parseEther("10000"); // 10k MNEE

  if (targetAddress && targetAddress.startsWith("0x") && targetAddress.length === 42) {
    // Fund specific address using getAddress to validate
    const validAddress = hre.ethers.getAddress(targetAddress);
    console.log(`\nMinting 10,000 MNEE to ${validAddress}...`);
    await mneeToken.mint(validAddress, mintAmount);
    
    const balance = await mneeToken.balanceOf(validAddress);
    console.log(`✅ New balance: ${hre.ethers.formatEther(balance)} MNEE`);
    
    // Also send some ETH for gas
    console.log(`\nSending 1 ETH for gas...`);
    await deployer.sendTransaction({
      to: validAddress,
      value: hre.ethers.parseEther("1")
    });
    console.log(`✅ Sent 1 ETH to ${validAddress}`);
  } else {
    // Fund all hardhat accounts
    console.log("\nNo valid TARGET_ADDRESS provided. Funding default Hardhat accounts...\n");
    console.log("Usage: set TARGET_ADDRESS=0xYourAddress && npx hardhat run scripts/fund-account.js --network localhost\n");
    
    const accounts = await hre.ethers.getSigners();
    
    for (let i = 0; i < Math.min(5, accounts.length); i++) {
      await mneeToken.mint(accounts[i].address, mintAmount);
      const balance = await mneeToken.balanceOf(accounts[i].address);
      console.log(`Account ${i} (${accounts[i].address}): ${hre.ethers.formatEther(balance)} MNEE`);
    }
  }

  console.log("\n========================================");
  console.log("MNEE Token Address:", MNEE_TOKEN_ADDRESS);
  console.log("Chain ID: 31337");
  console.log("RPC: http://127.0.0.1:8545");
  console.log("========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
