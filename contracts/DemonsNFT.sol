// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract DemonsNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _tokenIdCounter;
    
    // Rarity system
    enum Rarity { Common, Rare, Epic, Legendary, Mythic }
    
    // Demon stats tracking
    struct DemonStats {
        Rarity rarity;
        uint8 level;
        uint8 corruption;
        uint16 tradeCount;
        uint16 battleWins;
        uint256 mintTimestamp;
        uint256 lastEvolution;
    }
    
    mapping(uint256 => DemonStats) public demonStats;
    
    // Marketplace functionality
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
    }
    
    mapping(uint256 => Listing) public listings;
    mapping(address => uint256[]) public userListings;
    
    // Stats tracking
    uint256 public totalMinted;
    uint256 public totalBurned;
    uint256 public totalSold;
    
    // Events
    event NFTMinted(uint256 indexed tokenId, address indexed owner, string tokenURI, Rarity rarity);
    event NFTBurned(uint256 indexed tokenId, address indexed owner);
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event NFTUnlisted(uint256 indexed tokenId, address indexed seller);
    event DemonLevelUp(uint256 indexed tokenId, uint8 newLevel);
    event DemonBattleWin(uint256 indexed tokenId, uint8 newLevel);
    event DemonEvolution(uint256 indexed tokenId, uint8 newCorruption);
    
    constructor() ERC721("Demons NFT", "DEMON") Ownable(msg.sender) {}
    
    // Calculate rarity using pseudo-randomness
    function _calculateRarity(uint256 tokenId, address minter) internal view returns (Rarity) {
        uint256 seed = uint256(keccak256(abi.encodePacked(
            tokenId,
            minter,
            block.timestamp,
            block.prevrandao,
            blockhash(block.number - 1)
        )));
        
        uint256 rarityRoll = seed % 10000;
        
        // Distribution:
        // Common: 0-5999 (60%)
        // Rare: 6000-8499 (25%)
        // Epic: 8500-9499 (10%)
        // Legendary: 9500-9899 (4%)
        // Mythic: 9900-9999 (1%)
        
        if (rarityRoll < 6000) return Rarity.Common;
        if (rarityRoll < 8500) return Rarity.Rare;
        if (rarityRoll < 9500) return Rarity.Epic;
        if (rarityRoll < 9900) return Rarity.Legendary;
        return Rarity.Mythic;
    }
    
    // Mint function - Allow anyone to mint (remove onlyOwner for public minting)
    function mintNFT(address to, string memory uri) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Calculate rarity
        Rarity rarity = _calculateRarity(tokenId, to);
        
        // Initialize demon stats
        demonStats[tokenId] = DemonStats({
            rarity: rarity,
            level: 1,
            corruption: 0,
            tradeCount: 0,
            battleWins: 0,
            mintTimestamp: block.timestamp,
            lastEvolution: block.timestamp
        });
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        totalMinted++;
        
        emit NFTMinted(tokenId, to, uri, rarity);
        return tokenId;
    }
    
    // Burn function
    function burnNFT(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Only the owner can burn this NFT");
        
        _burn(tokenId);
        totalBurned++;
        
        // Remove from listings if it was listed
        if (listings[tokenId].active) {
            _removeListing(tokenId);
        }
        
        emit NFTBurned(tokenId, msg.sender);
    }
    
    // List NFT for sale
    function listNFT(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "Only the owner can list this NFT");
        require(price > 0, "Price must be greater than 0");
        require(!listings[tokenId].active, "NFT is already listed");
        
        listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            active: true
        });
        
        userListings[msg.sender].push(tokenId);
        
        emit NFTListed(tokenId, msg.sender, price);
    }
    
    // Buy NFT
    function buyNFT(uint256 tokenId) public payable nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "NFT is not for sale");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy your own NFT");
        
        address seller = listing.seller;
        uint256 price = listing.price;
        
        // Transfer NFT
        _transfer(seller, msg.sender, tokenId);
        
        // Update demon stats - increment trade count
        demonStats[tokenId].tradeCount++;
        
        // Transfer payment
        payable(seller).transfer(price);
        
        // Refund excess payment
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
        
        // Remove listing
        _removeListing(tokenId);
        
        totalSold++;
        
        emit NFTSold(tokenId, seller, msg.sender, price);
    }
    
    // Unlist NFT
    function unlistNFT(uint256 tokenId) public {
        require(listings[tokenId].seller == msg.sender, "Only the seller can unlist");
        require(listings[tokenId].active, "NFT is not listed");
        
        _removeListing(tokenId);
        
        emit NFTUnlisted(tokenId, msg.sender);
    }
    
    // Internal function to remove listing
    function _removeListing(uint256 tokenId) internal {
        listings[tokenId].active = false;
        
        // Remove from user listings array
        uint256[] storage userTokens = userListings[listings[tokenId].seller];
        for (uint256 i = 0; i < userTokens.length; i++) {
            if (userTokens[i] == tokenId) {
                userTokens[i] = userTokens[userTokens.length - 1];
                userTokens.pop();
                break;
            }
        }
    }
    
    // Get all active listings
    function getActiveListings() public view returns (Listing[] memory) {
        uint256 activeCount = 0;
        
        // Count active listings
        for (uint256 i = 0; i < _tokenIdCounter; i++) {
            if (listings[i].active) {
                activeCount++;
            }
        }
        
        // Create array with active listings
        Listing[] memory activeListings = new Listing[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < _tokenIdCounter; i++) {
            if (listings[i].active) {
                activeListings[index] = listings[i];
                index++;
            }
        }
        
        return activeListings;
    }
    
    // Get user's listings
    function getUserListings(address user) public view returns (uint256[] memory) {
        return userListings[user];
    }
    
    // Get marketplace stats
    function getMarketplaceStats() public view returns (uint256, uint256, uint256, uint256) {
        uint256 activeListings = 0;
        for (uint256 i = 0; i < _tokenIdCounter; i++) {
            if (listings[i].active) {
                activeListings++;
            }
        }
        
        return (totalMinted, totalBurned, totalSold, activeListings);
    }
    
    // Level up demon
    function levelUp(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Only the owner can level up");
        require(demonStats[tokenId].level < 100, "Maximum level reached");
        
        demonStats[tokenId].level++;
        emit DemonLevelUp(tokenId, demonStats[tokenId].level);
    }
    
    // Record battle win
    function recordBattleWin(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Only the owner can record battle");
        
        demonStats[tokenId].battleWins++;
        
        // Level up every 5 wins
        if (demonStats[tokenId].battleWins % 5 == 0 && demonStats[tokenId].level < 100) {
            demonStats[tokenId].level++;
            emit DemonLevelUp(tokenId, demonStats[tokenId].level);
        }
        
        emit DemonBattleWin(tokenId, demonStats[tokenId].level);
    }
    
    // Calculate time-based corruption (can be called by anyone)
    function updateCorruption(uint256 tokenId) public {
        DemonStats storage stats = demonStats[tokenId];
        uint256 timeSinceEvolution = block.timestamp - stats.lastEvolution;
        
        // Corruption increases by 1 every 7 days (604800 seconds)
        uint8 newCorruption = stats.corruption;
        if (timeSinceEvolution >= 604800) {
            uint8 corruptionIncrease = uint8(timeSinceEvolution / 604800);
            newCorruption = stats.corruption + corruptionIncrease;
            if (newCorruption > 100) newCorruption = 100; // Cap at 100
            
            stats.corruption = newCorruption;
            stats.lastEvolution = block.timestamp;
            emit DemonEvolution(tokenId, newCorruption);
        }
    }
    
    // Get demon stats
    function getDemonStats(uint256 tokenId) public view returns (DemonStats memory) {
        return demonStats[tokenId];
    }
    
    // Get rarity name as string (for frontend)
    function getRarityName(uint256 tokenId) public view returns (string memory) {
        Rarity rarity = demonStats[tokenId].rarity;
        if (rarity == Rarity.Common) return "Common";
        if (rarity == Rarity.Rare) return "Rare";
        if (rarity == Rarity.Epic) return "Epic";
        if (rarity == Rarity.Legendary) return "Legendary";
        return "Mythic";
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
