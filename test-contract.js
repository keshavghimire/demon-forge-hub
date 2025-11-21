const { ethers } = require("hardhat");

async function main() {
    console.log("Testing contract deployment and functionality...");

    // Get the contract factory
    const DemonsNFT = await ethers.getContractFactory("DemonsNFT");

    // Deploy the contract
    console.log("Deploying contract...");
    const demonsNFT = await DemonsNFT.deploy();
    await demonsNFT.deployed();

    console.log("Contract deployed to:", demonsNFT.address);

    // Test basic functionality
    console.log("Testing totalSupply...");
    const totalSupply = await demonsNFT.totalSupply();
    console.log("Total supply:", totalSupply.toString());

    // Test minting
    console.log("Testing minting...");
    const [owner] = await ethers.getSigners();
    console.log("Owner address:", owner.address);

    const tx = await demonsNFT.mintNFT(owner.address, "https://example.com/metadata");
    const receipt = await tx.wait();
    console.log("Mint transaction:", receipt.transactionHash);

    // Check total supply after minting
    const newTotalSupply = await demonsNFT.totalSupply();
    console.log("New total supply:", newTotalSupply.toString());

    // Check if owner owns the NFT
    const balance = await demonsNFT.balanceOf(owner.address);
    console.log("Owner balance:", balance.toString());

    console.log("Contract test completed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
