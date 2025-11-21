import { ethers } from "hardhat";

async function main() {
    console.log("Deploying DemonsNFT contract...");

    const DemonsNFT = await ethers.getContractFactory("DemonsNFT");
    const demonsNFT = await DemonsNFT.deploy();

    await demonsNFT.waitForDeployment();

    const contractAddress = await demonsNFT.getAddress();
    console.log("DemonsNFT deployed to:", contractAddress);

    // Save contract address to .env file for frontend
    console.log("\nAdd this to your .env file:");
    console.log(`REACT_APP_CONTRACT_ADDRESS=${contractAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
