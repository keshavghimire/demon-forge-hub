import { ethers } from 'ethers';
import { WalletService } from './wallet';

export interface NFTMetadata {
    name: string;
    description: string;
    image: string;
    attributes?: Array<{
        trait_type: string;
        value: string;
    }>;
}

export interface Listing {
    tokenId: number;
    seller: string;
    price: string;
    active: boolean;
}

export interface MarketplaceStats {
    totalMinted: number;
    totalBurned: number;
    totalSold: number;
    activeListings: number;
}

export interface DemonStats {
    rarity: number; // 0=Common, 1=Rare, 2=Epic, 3=Legendary, 4=Mythic
    level: number;
    corruption: number;
    tradeCount: number;
    battleWins: number;
    mintTimestamp: number;
    lastEvolution: number;
}

export class ContractService {
    private static instance: ContractService;
    private contract: ethers.Contract | null = null;
    private walletService: WalletService;

    // Contract ABI - Complete ABI matching deployed contract
    private static readonly CONTRACT_ABI = [
        // Core ERC721 functions
        "function approve(address to, uint256 tokenId) public",
        "function balanceOf(address owner) public view returns (uint256)",
        "function getApproved(uint256 tokenId) public view returns (address)",
        "function isApprovedForAll(address owner, address operator) public view returns (bool)",
        "function name() public view returns (string)",
        "function ownerOf(uint256 tokenId) public view returns (address)",
        "function safeTransferFrom(address from, address to, uint256 tokenId) public",
        "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data) public",
        "function setApprovalForAll(address operator, bool approved) public",
        "function supportsInterface(bytes4 interfaceId) public view returns (bool)",
        "function symbol() public view returns (string)",
        "function tokenURI(uint256 tokenId) public view returns (string)",
        "function transferFrom(address from, address to, uint256 tokenId) public",

        // Custom contract functions
        "function mintNFT(address to, string memory uri) public returns (uint256)",
        "function burnNFT(uint256 tokenId) public",
        "function listNFT(uint256 tokenId, uint256 price) public",
        "function buyNFT(uint256 tokenId) public payable",
        "function unlistNFT(uint256 tokenId) public",
        "function getActiveListings() public view returns (tuple(uint256 tokenId, address seller, uint256 price, bool active)[])",
        "function getUserListings(address user) public view returns (uint256[])",
        "function getMarketplaceStats() public view returns (uint256, uint256, uint256, uint256)",
        "function totalMinted() public view returns (uint256)",
        "function totalBurned() public view returns (uint256)",
        "function totalSold() public view returns (uint256)",
        
        // Demon stats functions
        "function getDemonStats(uint256 tokenId) public view returns (tuple(uint8 rarity, uint8 level, uint8 corruption, uint16 tradeCount, uint16 battleWins, uint256 mintTimestamp, uint256 lastEvolution))",
        "function getRarityName(uint256 tokenId) public view returns (string)",
        "function levelUp(uint256 tokenId) public",
        "function recordBattleWin(uint256 tokenId) public",
        "function updateCorruption(uint256 tokenId) public",

        // Ownership functions
        "function owner() public view returns (address)",
        "function renounceOwnership() public",
        "function transferOwnership(address newOwner) public",

        // Mapping functions
        "function listings(uint256) public view returns (uint256 tokenId, address seller, uint256 price, bool active)",
        "function userListings(address, uint256) public view returns (uint256)",

        // Events
        "event NFTMinted(uint256 indexed tokenId, address indexed owner, string tokenURI, uint8 rarity)",
        "event NFTBurned(uint256 indexed tokenId, address indexed owner)",
        "event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price)",
        "event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price)",
        "event NFTUnlisted(uint256 indexed tokenId, address indexed seller)",
        "event DemonLevelUp(uint256 indexed tokenId, uint8 newLevel)",
        "event DemonBattleWin(uint256 indexed tokenId, uint8 newLevel)",
        "event DemonEvolution(uint256 indexed tokenId, uint8 newCorruption)",
        "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
        "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
        "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
    ];

    constructor() {
        this.walletService = WalletService.getInstance();
    }

    static getInstance(): ContractService {
        if (!ContractService.instance) {
            ContractService.instance = new ContractService();
        }
        return ContractService.instance;
    }

    async initialize(): Promise<void> {
        const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

        if (!contractAddress) {
            throw new Error('Contract address not found in environment variables');
        }

        const walletState = this.walletService.getWalletState();
        
        // Use signer if wallet is connected, otherwise use read-only provider
        let providerOrSigner: ethers.providers.Provider | ethers.Signer;
        
        if (walletState.provider && walletState.signer) {
            // Wallet is connected, use signer for write operations
            providerOrSigner = walletState.signer;
        } else {
            // Wallet not connected, create read-only provider for read operations
            const rpcUrl = import.meta.env.VITE_RPC_URL || 'http://localhost:8545';
            providerOrSigner = new ethers.providers.JsonRpcProvider(rpcUrl);
        }

        this.contract = new ethers.Contract(
            contractAddress,
            ContractService.CONTRACT_ABI,
            providerOrSigner
        );
    }

    private ensureSigner(): void {
        const walletState = this.walletService.getWalletState();
        if (!walletState.signer) {
            throw new Error('Wallet not connected. Please connect your wallet to perform this action.');
        }
    }

    async mintNFT(metadata: NFTMetadata, imageFile: File): Promise<number> {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }
        this.ensureSigner();

        try {
            // Convert uploaded image to data URL
            console.log('Processing uploaded image...');
            const imageUrl = await this.convertFileToDataURL(imageFile);
            console.log('Image converted to data URL');
            console.log('Image data URL size:', imageUrl.length, 'characters');

            // For local demo: Use minimal metadata on-chain to reduce gas costs
            // Full metadata with image will be stored in localStorage
            const minimalMetadata = {
                name: metadata.name,
                description: (metadata.description || '').substring(0, 200),
                image: `ipfs://local/${Date.now()}`, // Placeholder
            };

            // Create minimal metadata for on-chain storage
            const metadataJson = JSON.stringify(minimalMetadata);
            const metadataUrl = `data:application/json;base64,${btoa(metadataJson)}`;
            
            console.log('On-chain metadata size:', metadataUrl.length, 'characters');

            // Mint NFT and get the token ID directly from the transaction
            const walletState = this.walletService.getWalletState();

            console.log('Minting NFT for address:', walletState.address);
            console.log('Using metadata URL:', metadataUrl.substring(0, 100) + '...');
            console.log('Metadata size:', metadataUrl.length, 'characters');

            // Estimate gas first
            let gasEstimate;
            try {
                gasEstimate = await this.contract.estimateGas.mintNFT(walletState.address, metadataUrl);
                console.log('Estimated gas:', gasEstimate.toString());
                // Add 20% buffer for safety
                gasEstimate = gasEstimate.mul(120).div(100);
            } catch (estimateError) {
                console.warn('Gas estimation failed, using default:', estimateError);
                // Use a high gas limit as fallback (50M should be enough)
                gasEstimate = ethers.BigNumber.from('50000000');
            }

            const tx = await this.contract.mintNFT(walletState.address, metadataUrl, {
                gasLimit: gasEstimate
            });
            console.log('Transaction sent:', tx.hash);
            console.log('Gas limit used:', gasEstimate.toString());
            console.log('Waiting for confirmation...');

            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);
            console.log('Transaction status:', receipt.status === 1 ? 'Success' : 'Failed');

            // Get token ID from the transaction result
            let tokenId = null;

            // Method 1: Try to parse the event logs
            console.log('Parsing transaction logs:', receipt.logs.length);
            for (const log of receipt.logs) {
                try {
                    const parsedLog = this.contract.interface.parseLog(log);
                    console.log('Parsed log:', parsedLog);
                    if (parsedLog && (parsedLog.name === 'NFTMinted' || parsedLog.name === 'Transfer')) {
                        // NFTMinted event has tokenId directly
                        if (parsedLog.name === 'NFTMinted' && parsedLog.args.tokenId) {
                            tokenId = Number(parsedLog.args.tokenId);
                            console.log('Found token ID from NFTMinted event:', tokenId);
                            break;
                        }
                        // Transfer event from address(0) indicates a mint
                        if (parsedLog.name === 'Transfer' && parsedLog.args.from === ethers.constants.AddressZero && parsedLog.args.tokenId) {
                            tokenId = Number(parsedLog.args.tokenId);
                            console.log('Found token ID from Transfer event:', tokenId);
                            break;
                        }
                    }
                } catch (e) {
                    console.log('Failed to parse log:', e);
                    continue;
                }
            }

            // Method 2: If event parsing fails, use total minted as fallback
            if (tokenId === null) {
                try {
                    const totalMinted = await this.contract.totalMinted();
                    console.log('Total minted:', totalMinted.toString());
                    tokenId = Number(totalMinted) - 1; // Last minted token ID
                    console.log('Using fallback token ID:', tokenId);
                } catch (e) {
                    console.log('Failed to get total minted:', e);
                    tokenId = 0; // Fallback to 0
                }
            }

            console.log('Final token ID:', tokenId);
            
            // Store full metadata with image in localStorage for retrieval
            if (tokenId !== null) {
                const fullMetadata = {
                    ...metadata,
                    image: imageUrl,
                };
                try {
                    const storageKey = `nft_metadata_${tokenId}`;
                    localStorage.setItem(storageKey, JSON.stringify(fullMetadata));
                    console.log('Full metadata stored in localStorage for token', tokenId);
                } catch (storageError) {
                    console.warn('Failed to store metadata in localStorage:', storageError);
                }
            }
            
            return tokenId;
        } catch (error) {
            console.error('Error minting NFT:', error);
            throw error;
        }
    }

    async burnNFT(tokenId: number): Promise<void> {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }
        this.ensureSigner();

        try {
            const tx = await this.contract.burnNFT(tokenId);
            await tx.wait();
        } catch (error) {
            console.error('Error burning NFT:', error);
            throw error;
        }
    }

    async listNFT(tokenId: number, price: string): Promise<void> {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }
        this.ensureSigner();

        try {
            const priceInWei = ethers.utils.parseEther(price);
            const tx = await this.contract.listNFT(tokenId, priceInWei);
            await tx.wait();
        } catch (error) {
            console.error('Error listing NFT:', error);
            throw error;
        }
    }

    async buyNFT(tokenId: number, price: string): Promise<void> {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }
        this.ensureSigner();

        try {
            const priceInWei = ethers.utils.parseEther(price);
            const tx = await this.contract.buyNFT(tokenId, { value: priceInWei });
            await tx.wait();
        } catch (error) {
            console.error('Error buying NFT:', error);
            throw error;
        }
    }

    async unlistNFT(tokenId: number): Promise<void> {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }
        this.ensureSigner();

        try {
            const tx = await this.contract.unlistNFT(tokenId);
            await tx.wait();
        } catch (error) {
            console.error('Error unlisting NFT:', error);
            throw error;
        }
    }

    async getActiveListings(): Promise<Listing[]> {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        try {
            const listings = await this.contract.getActiveListings();
            return listings.map((listing: any) => ({
                tokenId: Number(listing.tokenId),
                seller: listing.seller,
                price: ethers.utils.formatEther(listing.price),
                active: listing.active,
            }));
        } catch (error) {
            console.error('Error fetching active listings:', error);
            throw error;
        }
    }

    async getUserListings(userAddress: string): Promise<number[]> {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        try {
            const listings = await this.contract.getUserListings(userAddress);
            return listings.map((tokenId: any) => Number(tokenId));
        } catch (error) {
            console.error('Error fetching user listings:', error);
            throw error;
        }
    }

    async getListing(tokenId: number): Promise<Listing | null> {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        try {
            const listingData = await this.contract.listings(tokenId);
            if (listingData && listingData.active) {
                return {
                    tokenId: Number(listingData.tokenId),
                    seller: listingData.seller,
                    price: ethers.utils.formatEther(listingData.price),
                    active: listingData.active,
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching listing:', error);
            return null;
        }
    }

    async getMarketplaceStats(): Promise<MarketplaceStats> {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        try {
            const stats = await this.contract.getMarketplaceStats();
            return {
                totalMinted: Number(stats[0]),
                totalBurned: Number(stats[1]),
                totalSold: Number(stats[2]),
                activeListings: Number(stats[3]),
            };
        } catch (error) {
            console.error('Error fetching marketplace stats:', error);
            throw error;
        }
    }

    async getUserNFTs(userAddress: string): Promise<number[]> {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        try {
            console.log('Getting NFTs for user:', userAddress);

            // Get the total minted first
            const totalMinted = await this.contract.totalMinted();
            console.log('Total minted:', totalMinted.toString());

            if (Number(totalMinted) === 0) {
                console.log('No NFTs minted yet');
                return [];
            }

            const tokenIds: number[] = [];

            // Check each token ID to see if the user owns it
            // Note: Token IDs are sequential starting from 0, but some might be burned
            for (let i = 0; i < Number(totalMinted); i++) {
                try {
                    const owner = await this.contract.ownerOf(i);
                    console.log(`Token ${i} owner:`, owner);
                    if (owner.toLowerCase() === userAddress.toLowerCase()) {
                        tokenIds.push(i);
                        console.log(`User owns token ${i}`);
                    }
                } catch (error) {
                    console.log(`Token ${i} doesn't exist (likely burned):`, error.message);
                    // Continue to next token - this is expected for burned tokens
                }
            }

            console.log('User owns tokens:', tokenIds);
            return tokenIds;
        } catch (error) {
            console.error('Error fetching user NFTs:', error);
            throw error;
        }
    }

    async getNFTMetadata(tokenId: number): Promise<NFTMetadata> {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        try {
            // First check localStorage for full metadata (with image)
            try {
                const storageKey = `nft_metadata_${tokenId}`;
                const storedMetadata = localStorage.getItem(storageKey);
                if (storedMetadata) {
                    const parsed = JSON.parse(storedMetadata);
                    console.log('Retrieved full metadata from localStorage for token', tokenId);
                    return parsed;
                }
            } catch (storageError) {
                console.log('No stored metadata found, using on-chain metadata');
            }

            const tokenURI = await this.contract.tokenURI(tokenId);
            console.log('Token URI for token', tokenId, ':', tokenURI);

            // For testing with placeholder URLs, return mock metadata
            if (tokenURI.includes('jsonplaceholder.typicode.com')) {
                return {
                    name: `Demo NFT #${tokenId}`,
                    description: `This is a demo NFT with token ID ${tokenId}`,
                    image: `https://api.dicebear.com/7.x/shapes/svg?seed=${tokenId}`,
                    attributes: [
                        {
                            trait_type: "Token ID",
                            value: tokenId.toString()
                        },
                        {
                            trait_type: "Type",
                            value: "Demo"
                        }
                    ]
                };
            }

            // Handle data URLs (base64 encoded metadata)
            if (tokenURI.startsWith('data:application/json;base64,')) {
                const base64Data = tokenURI.split(',')[1];
                const jsonString = atob(base64Data);
                const onChainMetadata = JSON.parse(jsonString);
                
                // Merge with localStorage metadata if available (localStorage has full image)
                try {
                    const storageKey = `nft_metadata_${tokenId}`;
                    const storedMetadata = localStorage.getItem(storageKey);
                    if (storedMetadata) {
                        const fullMetadata = JSON.parse(storedMetadata);
                        // Merge: use on-chain name/description, but full image from storage
                        return {
                            ...onChainMetadata,
                            image: fullMetadata.image || onChainMetadata.image,
                            attributes: fullMetadata.attributes || onChainMetadata.attributes,
                        };
                    }
                } catch (e) {
                    // If merge fails, just return on-chain metadata
                }
                
                return onChainMetadata;
            }

            // Handle IPFS URLs
            if (tokenURI.includes('ipfs.nftstorage.link') || tokenURI.includes('ipfs://')) {
                // IPFS URLs should contain the actual metadata
                const response = await fetch(tokenURI);
                if (!response.ok) {
                    throw new Error(`Failed to fetch metadata: ${response.status}`);
                }
                return await response.json();
            }

            const response = await fetch(tokenURI);
            if (!response.ok) {
                throw new Error(`Failed to fetch metadata: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching NFT metadata:', error);
            // Return fallback metadata instead of throwing
            return {
                name: `NFT #${tokenId}`,
                description: `NFT with token ID ${tokenId}`,
                image: `https://api.dicebear.com/7.x/shapes/svg?seed=${tokenId}`,
                attributes: [
                    {
                        trait_type: "Token ID",
                        value: tokenId.toString()
                    }
                ]
            };
        }
    }

    private async convertFileToDataURL(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    private async uploadToIPFS(file: File): Promise<string> {
        const apiKey = import.meta.env.VITE_NFT_STORAGE_API_KEY;
        if (!apiKey) {
            throw new Error('NFT.Storage API key not found');
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('https://api.nft.storage/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload to IPFS');
        }

        const result = await response.json();
        return `https://${result.value.cid}.ipfs.nftstorage.link/`;
    }

    private async uploadMetadataToIPFS(metadata: NFTMetadata): Promise<string> {
        const apiKey = import.meta.env.VITE_NFT_STORAGE_API_KEY;
        if (!apiKey) {
            throw new Error('NFT.Storage API key not found');
        }

        const response = await fetch('https://api.nft.storage/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(metadata),
        });

        if (!response.ok) {
            throw new Error('Failed to upload metadata to IPFS');
        }

        const result = await response.json();
        return `https://${result.value.cid}.ipfs.nftstorage.link/`;
    }

    // Demon stats functions
    async getDemonStats(tokenId: number): Promise<DemonStats> {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        try {
            const stats = await this.contract.getDemonStats(tokenId);
            return {
                rarity: Number(stats.rarity),
                level: Number(stats.level),
                corruption: Number(stats.corruption),
                tradeCount: Number(stats.tradeCount),
                battleWins: Number(stats.battleWins),
                mintTimestamp: Number(stats.mintTimestamp),
                lastEvolution: Number(stats.lastEvolution),
            };
        } catch (error) {
            console.error('Error fetching demon stats:', error);
            throw error;
        }
    }

    async getRarityName(tokenId: number): Promise<string> {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        try {
            return await this.contract.getRarityName(tokenId);
        } catch (error) {
            console.error('Error fetching rarity name:', error);
            throw error;
        }
    }

    async levelUp(tokenId: number): Promise<void> {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }
        this.ensureSigner();

        try {
            const tx = await this.contract.levelUp(tokenId);
            await tx.wait();
        } catch (error) {
            console.error('Error leveling up demon:', error);
            throw error;
        }
    }

    async recordBattleWin(tokenId: number): Promise<void> {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }
        this.ensureSigner();

        try {
            const tx = await this.contract.recordBattleWin(tokenId);
            await tx.wait();
        } catch (error) {
            console.error('Error recording battle win:', error);
            throw error;
        }
    }

    async updateCorruption(tokenId: number): Promise<void> {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }
        this.ensureSigner();

        try {
            const tx = await this.contract.updateCorruption(tokenId);
            await tx.wait();
        } catch (error) {
            console.error('Error updating corruption:', error);
            throw error;
        }
    }

    async getOwner(tokenId: number): Promise<string> {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        try {
            return await this.contract.ownerOf(tokenId);
        } catch (error) {
            console.error('Error fetching owner:', error);
            throw error;
        }
    }
}
