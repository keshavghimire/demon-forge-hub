// Script to display Hardhat test accounts with balances
// Run with: node scripts/get-accounts.js

const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔑 Hardhat Test Accounts (for MetaMask import)\n");
  console.log("=" .repeat(80));
  
  // Get the default Hardhat accounts
  const accounts = await ethers.getSigners();
  
  for (let i = 0; i < Math.min(5, accounts.length); i++) {
    const account = accounts[i];
    const balance = await ethers.provider.getBalance(account.address);
    const balanceInEth = ethers.utils.formatEther(balance);
    
    // Get private key from Hardhat's default accounts
    // These are the standard Hardhat test accounts
    const privateKeys = [
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
      "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
      "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
      "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f873d9ba54ac7e3a4f5c0"
    ];
    
    console.log(`\n📝 Account ${i + 1}:`);
    console.log(`   Address: ${account.address}`);
    console.log(`   Balance: ${balanceInEth} ETH`);
    console.log(`   Private Key: ${privateKeys[i]}`);
    console.log(`   ──────────────────────────────────────────────────────────────`);
  }
  
  console.log("\n✅ To import into MetaMask:");
  console.log("   1. Open MetaMask");
  console.log("   2. Click account icon → Import Account");
  console.log("   3. Paste one of the private keys above");
  console.log("   4. Make sure you're on 'Hardhat Local' network (Chain ID: 1337)");
  console.log("\n💡 Recommended: Use Account 1 (has the most ETH)\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

