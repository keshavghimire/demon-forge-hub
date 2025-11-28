Here’s an updated `README.md` you can drop into the repo:

````markdown
# Demon Forge Hub 👹  
**An AI-Enhanced Gamified NFT Marketplace on Polygon**

Demon Forge Hub is a decentralized NFT marketplace that combines:

- **ERC-721 smart contracts** on Polygon Mumbai  
- **Gamified NFT mechanics** (rarity, levels, corruption, battle stats)  
- **AI-enhanced lore generation** for each demon  
- **Modern React + TypeScript frontend** with read-only marketplace browsing  

The goal is to turn NFTs from static images into **narrative-rich, evolving digital entities**.

---

## 🚀 Core Features

### 🎴 NFT & Marketplace

- ERC-721-based **Demon NFTs** with on-chain stats
- **Mint, list, buy, unlist, and burn** NFTs
- On-chain gamification:
  - Rarity tiers (Common → Mythic)
  - Level system
  - Corruption progression
  - Battle win tracking
- **Peer-to-peer marketplace** (no centralized order book)

### 🧠 AI-Enhanced Lore Generation

- Off-chain AI (Node.js/Express) service generates:
  - Name, title, origin realm
  - Abilities and personality traits
  - Multi-paragraph backstory
- Fallback **deterministic templates** when external AI is unavailable
- Lore is cached in the browser (`localStorage`) for fast retrieval

> ❗ Lore is **not stored on-chain** in the current prototype.  
> The contract only stores a metadata URI (which can point to IPFS or a data URL).

### 👀 Read-Only Marketplace

- Users can **browse all active listings without connecting a wallet**
- Read-only JSON-RPC provider is used when no wallet is connected
- Write operations (mint, list, buy, burn, level up) require MetaMask

### 🧱 Tech Stack

**Frontend**

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui + Radix UI
- React Router
- TanStack Query
- React Hook Form
- Lucide icons

**Smart Contracts**

- Solidity `0.8.20`
- Hardhat `2.19.x`
- OpenZeppelin Contracts `5.x`
- TypeChain + Ethers.js

**AI & Storage**

- Node.js + Express (AI lore microservice)
- Optional external LLM API (e.g., OpenAI)
- IPFS via `NFT.Storage` (utilities implemented)
- `localStorage` for lore + cached metadata
- Optional Supabase client (not yet wired into core flows)

---

## 🏗 Architecture Overview

The system is implemented as a multi-layered dApp:

- **Smart Contract Layer**  
  - `DemonsNFT.sol`  
  - ERC-721 + `ERC721URIStorage` + `Ownable` + `ReentrancyGuard`  
  - Stores:
    - Ownership
    - Metadata URI
    - Demon stats (rarity, level, corruption, trade count, battle wins)
    - Marketplace listings

- **Frontend Layer** (React + TypeScript)  
  Pages:
  - `Home` – overview and stats
  - `Mint` – upload media, mint NFT, trigger lore
  - `Marketplace` – browse and buy listed NFTs
  - `MyNFTs` – manage owned demons
  - `NFTDetail` – full demon details + lore
  - `Faucet` – instructions for Mumbai testnet MATIC

- **AI Lore Service**  
  - Express server (`/api/generate-lore`)
  - Accepts JSON payload with rarity, tokenId, etc.
  - Returns structured `DemonLore` object

- **Storage & Caching**
  - IPFS (planned for full integration)
  - `localStorage` for lore and some metadata
  - Optional Supabase client stub for future analytics

---

## 📂 Project Structure

```text
demon-forge-hub/
├── contracts/
│   └── DemonsNFT.sol          # Main ERC-721 contract
├── scripts/
│   ├── deploy.ts              # TypeScript deployment script
│   └── deploy.cjs             # CommonJS deployment script
├── src/
│   ├── components/
│   ├── contexts/
│   ├── lib/
│   │   ├── wallet.ts          # WalletService
│   │   ├── contract.ts        # ContractService (read + write)
│   │   ├── ai-service.ts      # AI service client
│   │   └── lore-storage.ts    # localStorage helpers
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Mint.tsx
│   │   ├── Marketplace.tsx
│   │   ├── MyNFTs.tsx
│   │   ├── NFTDetail.tsx
│   │   └── Faucet.tsx
│   └── assets/
├── server/
│   └── ai-service.js          # Express AI microservice
├── typechain-types/
├── artifacts/
└── public/
````

---

## ⚙️ Getting Started

### 1️⃣ Prerequisites

* Node.js (v16+)
* npm or yarn
* MetaMask (browser extension)
* Access to:

  * Local Hardhat node **or**
  * Polygon Mumbai testnet RPC

---

### 2️⃣ Install Dependencies

```bash
git clone <YOUR_REPO_URL>
cd demon-forge-hub
npm install
```

---

### 3️⃣ Environment Configuration

Create a `.env` file (or `.env.local` for Vite) based on `.env.example`:

```env
# Blockchain / RPC
VITE_RPC_URL=http://127.0.0.1:8545
VITE_NETWORK_ID=1337              # 1337 (Hardhat) or 80001 (Mumbai)

# Contract
VITE_CONTRACT_ADDRESS=0xYourContractAddress

# IPFS / NFT.Storage (optional)
VITE_NFT_STORAGE_API_KEY=your_nft_storage_api_key

# AI Service
VITE_AI_SERVICE_URL=http://localhost:3001
```

> ✅ In the **current prototype**, the default minting flow uses `data:` URLs + local caching.
> IPFS utilities exist but are not fully wired into the main UI yet.

---

### 4️⃣ Running a Local Hardhat Network

In a separate terminal:

```bash
npm run node
```

This runs a Hardhat node at `http://127.0.0.1:8545`.

---

### 5️⃣ Deploying the Contract Locally

```bash
npm run deploy:localhost
```

Copy the deployed address from the console and update:

```env
VITE_CONTRACT_ADDRESS=0x...
VITE_NETWORK_ID=1337
VITE_RPC_URL=http://127.0.0.1:8545
```

---

### 6️⃣ Starting the AI Lore Service (Optional)

```bash
cd server
node ai-service.js
```

The service exposes:

* `POST /api/generate-lore`

If the AI API key is not configured, the service falls back to deterministic templates.

---

### 7️⃣ Start the Frontend

Back in the project root:

```bash
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

---

## ✅ Current Status vs Intended Design

### Implemented

* ERC-721 contract with:

  * Rarity, level, corruption, trade count, battle wins
  * Marketplace: mint, list, buy, unlist, burn
* React + TypeScript frontend
* Read-only marketplace browsing
* AI lore microservice + localStorage caching
* Basic Mumbai + Hardhat deployment scripts



---

## 🧪 Testing

> ⚠️ **Important:** The current repository does **not** include automated tests yet.

Planned testing strategy:

* **Smart Contracts**

  * Hardhat + Chai unit tests
  * Solidity Coverage for metrics
  * Hardhat Gas Reporter for cost analysis
* **Integration**

  * End-to-end workflows on a local Hardhat node
* **Frontend**

  * UI tests and task-based user scenarios

For now, validation is primarily manual:

* Mint → List → Buy → Burn
* Read-only browsing without wallet
* Lore generation and caching behavior

---

## 🔐 Security Considerations

* Uses `ReentrancyGuard` on value-transferring functions (`buyNFT`)
* Ownership checks for listing and burning
* Uses `_safeMint` and `_safeTransfer` from OpenZeppelin
* Benefits from Solidity `0.8.x` overflow/underflow protections
* No private keys handled in the frontend — all signing via MetaMask

For a production deployment, a **formal audit** and extended threat modeling are strongly recommended.

---


## 📄 License

This project is licensed under the **MIT License**.
See `LICENSE` for details.

---

##  Author

**Keshav Ghimire**
