# Demons NFT Marketplace

A decentralized NFT marketplace built on Polygon Mumbai Testnet featuring minting, burning, buying, and selling of demonic-themed NFTs.

## 🚀 Features

- **Wallet Integration**: Connect MetaMask wallet with automatic Mumbai network switching
- **NFT Minting**: Upload images/videos and mint NFTs with IPFS metadata storage
- **NFT Burning**: Permanently destroy NFTs you own
- **Marketplace**: List NFTs for sale and buy from other users
- **My NFTs**: Manage your collection with listing and burning capabilities
- **Faucet Integration**: Direct access to Polygon Mumbai testnet faucet
- **Real-time Stats**: Live marketplace statistics (minted, burned, sold, active listings)
- **Dark Fantasy Theme**: Immersive UI with demonic aesthetics

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Blockchain**: Solidity, Hardhat, Ethers.js
- **Storage**: IPFS via NFT.Storage
- **Network**: Polygon Mumbai Testnet
- **Wallet**: MetaMask

## 📋 Prerequisites

- Node.js (v16 or higher)
- MetaMask browser extension
- Polygon Mumbai testnet MATIC tokens (get from faucet)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd demon-forge-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   # Hardhat Configuration
   PRIVATE_KEY=your_private_key_here
   POLYGONSCAN_API_KEY=your_polygonscan_api_key_here

   # Frontend Configuration
   REACT_APP_CONTRACT_ADDRESS=
   REACT_APP_NFT_STORAGE_API_KEY=your_nft_storage_api_key_here

   # Network Configuration
   REACT_APP_NETWORK_ID=80001
   REACT_APP_RPC_URL=https://rpc-mumbai.maticvigil.com
   ```

4. **Get NFT.Storage API Key**
   - Visit [NFT.Storage](https://nft.storage/)
   - Create an account and generate an API key
   - Add it to your `.env` file

## 🚀 Deployment

### Smart Contract Deployment

1. **Compile the contract**
   ```bash
   npx hardhat compile
   ```

2. **Deploy to Mumbai testnet**
   ```bash
   npx hardhat run scripts/deploy.ts --network mumbai
   ```

3. **Update contract address**
   - Copy the deployed contract address from the terminal output
   - Add it to your `.env` file as `REACT_APP_CONTRACT_ADDRESS`

4. **Verify contract (optional)**
   ```bash
   npx hardhat verify --network mumbai <CONTRACT_ADDRESS>
   ```

### Frontend Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform**
   - Vercel, Netlify, or any static hosting service
   - Make sure to set the environment variables in your deployment platform

## 🎮 Usage

### Getting Started

1. **Connect Wallet**
   - Click "Connect Wallet" in the navbar
   - MetaMask will prompt to switch to Mumbai network
   - Approve the connection

2. **Get Test Tokens**
   - Visit the Faucet page
   - Click "Open Polygon Faucet"
   - Enter your wallet address and claim free MATIC

3. **Mint NFTs**
   - Go to the Mint page
   - Upload an image or video
   - Enter name and description
   - Click "Mint NFT"
   - Approve the transaction in MetaMask

4. **List for Sale**
   - Go to "My NFTs" page
   - Click "List" on any NFT you own
   - Enter the price in MATIC
   - Confirm the transaction

5. **Buy NFTs**
   - Browse the Marketplace
   - Click "Buy" on any listed NFT
   - Approve the transaction and payment

6. **Burn NFTs**
   - Go to "My NFTs" page
   - Click "Burn" on any NFT you own
   - Confirm the irreversible action

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout wrapper
│   ├── Navbar.tsx      # Navigation with wallet connection
│   └── ui/             # shadcn/ui components
├── contexts/           # React contexts
│   └── WalletContext.tsx # Wallet state management
├── lib/                # Utility libraries
│   ├── wallet.ts       # Wallet service
│   ├── contract.ts     # Smart contract interactions
│   └── utils.ts        # General utilities
├── pages/              # Page components
│   ├── Home.tsx        # Landing page with stats
│   ├── Mint.tsx        # NFT minting page
│   ├── MyNFTs.tsx      # User's NFT collection
│   ├── Marketplace.tsx  # NFT marketplace
│   └── Faucet.tsx      # Test token faucet
└── assets/             # Static assets

contracts/
└── DemonsNFT.sol       # Main ERC-721 contract

scripts/
└── deploy.ts           # Deployment script
```

## 🔒 Smart Contract Features

The `DemonsNFT` contract includes:

- **ERC-721 Standard**: Full NFT functionality
- **Minting**: Only contract owner can mint NFTs
- **Burning**: NFT owners can burn their tokens
- **Marketplace**: List, buy, and unlist NFTs
- **Events**: Comprehensive event logging
- **Stats**: Track minted, burned, and sold NFTs

### Contract Functions

- `mintNFT(address to, string tokenURI)`: Mint new NFT
- `burnNFT(uint256 tokenId)`: Burn existing NFT
- `listNFT(uint256 tokenId, uint256 price)`: List NFT for sale
- `buyNFT(uint256 tokenId)`: Buy listed NFT
- `unlistNFT(uint256 tokenId)`: Remove from marketplace
- `getActiveListings()`: Get all active listings
- `getMarketplaceStats()`: Get marketplace statistics

## 🌐 Network Configuration

### Polygon Mumbai Testnet
- **Network Name**: Polygon Mumbai
- **RPC URL**: https://rpc-mumbai.maticvigil.com
- **Chain ID**: 80001
- **Currency**: MATIC
- **Block Explorer**: https://mumbai.polygonscan.com/

## 🐛 Troubleshooting

### Common Issues

1. **"Contract not initialized" error**
   - Make sure `REACT_APP_CONTRACT_ADDRESS` is set in your `.env` file
   - Ensure the contract is deployed and the address is correct

2. **"MetaMask is not installed" error**
   - Install MetaMask browser extension
   - Make sure it's enabled and unlocked

3. **"Insufficient funds" error**
   - Get test MATIC from the faucet
   - Check your wallet balance

4. **"Network mismatch" error**
   - The app will automatically prompt to switch to Mumbai network
   - Manually add Mumbai network if needed

5. **IPFS upload fails**
   - Check your NFT.Storage API key
   - Ensure the API key has proper permissions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This is a testnet application for demonstration purposes only. No real value is involved. Always test thoroughly before deploying to mainnet.

## 🔗 Links

- [Polygon Mumbai Faucet](https://faucet.polygon.technology/)
- [NFT.Storage](https://nft.storage/)
- [MetaMask](https://metamask.io/)
- [Polygon Mumbai Explorer](https://mumbai.polygonscan.com/)

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.