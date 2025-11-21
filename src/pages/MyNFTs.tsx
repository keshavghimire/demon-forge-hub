import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Flame, Trash2, Loader2, DollarSign, AlertTriangle, TrendingUp, Sword, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { ContractService, NFTMetadata, Listing, DemonStats } from "@/lib/contract";
import { LoreStorage } from "@/lib/lore-storage";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

interface MyNFT {
  tokenId: number;
  metadata: NFTMetadata | null;
  isListed: boolean;
  listing?: Listing;
  stats?: DemonStats;
  rarityName?: string;
}

const MyNFTs = () => {
  const [myNFTs, setMyNFTs] = useState<MyNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [burningTokenId, setBurningTokenId] = useState<number | null>(null);
  const [listingTokenId, setListingTokenId] = useState<number | null>(null);
  const [listingPrice, setListingPrice] = useState("");
  const [isListing, setIsListing] = useState(false);
  const [levelingUpTokenId, setLevelingUpTokenId] = useState<number | null>(null);
  const [battlingTokenId, setBattlingTokenId] = useState<number | null>(null);
  
  const { walletState } = useWallet();
  const contractService = ContractService.getInstance();
  const navigate = useNavigate();

  useEffect(() => {
    if (walletState.isConnected) {
      loadMyNFTs();
    }
  }, [walletState.isConnected, walletState.address]);

  const loadMyNFTs = async () => {
    if (!walletState.address) return;

    try {
      setLoading(true);
      await contractService.initialize();
      
      // Get user's NFTs
      const tokenIds = await contractService.getUserNFTs(walletState.address);
      
      // Get user's listings
      const userListings = await contractService.getUserListings(walletState.address);
      
      // Fetch metadata and stats for each NFT
      const nftsWithMetadata = await Promise.all(
        tokenIds.map(async (tokenId) => {
          try {
            let metadata = await contractService.getNFTMetadata(tokenId);
            const isListed = userListings.includes(tokenId);
            
            // Check if we have AI-generated lore in storage and enhance metadata
            const lore = LoreStorage.getLore(tokenId);
            if (lore) {
              metadata = {
                ...metadata,
                name: lore.name,
                description: `${lore.backstory}\n\nRole: ${lore.role}\nRealm: ${lore.realm}\nPersonality: ${lore.personality}`,
                attributes: [
                  ...(metadata.attributes || []),
                  {
                    trait_type: "Rarity",
                    value: lore.rarity,
                  },
                  {
                    trait_type: "Role",
                    value: lore.role,
                  },
                  {
                    trait_type: "Realm",
                    value: lore.realm,
                  },
                  {
                    trait_type: "Personality",
                    value: lore.personality,
                  },
                  ...lore.abilities.map((ability, index) => ({
                    trait_type: `Ability ${index + 1}`,
                    value: ability,
                  })),
                ],
              };
            }
            
            // Fetch listing details if listed
            let listing: Listing | undefined;
            if (isListed) {
              try {
                listing = await contractService.getListing(tokenId);
              } catch (listingError) {
                console.error(`Error fetching listing for token ${tokenId}:`, listingError);
              }
            }
            
            // Fetch demon stats
            let stats: DemonStats | undefined;
            let rarityName: string | undefined;
            try {
              stats = await contractService.getDemonStats(tokenId);
              rarityName = await contractService.getRarityName(tokenId);
            } catch (statsError) {
              console.error(`Error fetching stats for token ${tokenId}:`, statsError);
            }
            
            return {
              tokenId,
              metadata,
              isListed,
              listing,
              stats,
              rarityName,
            };
          } catch (error) {
            console.error(`Error fetching metadata for token ${tokenId}:`, error);
            return {
              tokenId,
              metadata: null,
              isListed: userListings.includes(tokenId),
            };
          }
        })
      );
      
      setMyNFTs(nftsWithMetadata);
    } catch (error) {
      console.error("Error loading NFTs:", error);
      toast.error("Failed to load your NFTs");
    } finally {
      setLoading(false);
    }
  };

  const handleBurnNFT = async (tokenId: number) => {
    if (!walletState.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setBurningTokenId(tokenId);
      await contractService.initialize();
      await contractService.burnNFT(tokenId);
      
      toast.success("NFT burned successfully!");
      loadMyNFTs(); // Refresh NFTs
    } catch (error: any) {
      console.error("Error burning NFT:", error);
      toast.error(error.message || "Failed to burn NFT");
    } finally {
      setBurningTokenId(null);
    }
  };

  const handleListNFT = async (tokenId: number) => {
    if (!walletState.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!listingPrice || parseFloat(listingPrice) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    try {
      setIsListing(true);
      await contractService.initialize();
      await contractService.listNFT(tokenId, listingPrice);
      
      toast.success("NFT listed for sale successfully!");
      setListingPrice("");
      setListingTokenId(null);
      loadMyNFTs(); // Refresh NFTs
    } catch (error: any) {
      console.error("Error listing NFT:", error);
      toast.error(error.message || "Failed to list NFT");
    } finally {
      setIsListing(false);
    }
  };

  const handleUnlistNFT = async (tokenId: number) => {
    if (!walletState.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      await contractService.initialize();
      await contractService.unlistNFT(tokenId);
      
      toast.success("NFT unlisted successfully!");
      loadMyNFTs(); // Refresh NFTs
    } catch (error: any) {
      console.error("Error unlisting NFT:", error);
      toast.error(error.message || "Failed to unlist NFT");
    }
  };

  const handleLevelUp = async (tokenId: number) => {
    if (!walletState.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setLevelingUpTokenId(tokenId);
      await contractService.initialize();
      await contractService.levelUp(tokenId);
      
      toast.success("Demon leveled up!");
      loadMyNFTs(); // Refresh NFTs
    } catch (error: any) {
      console.error("Error leveling up:", error);
      toast.error(error.message || "Failed to level up");
    } finally {
      setLevelingUpTokenId(null);
    }
  };

  const handleBattleWin = async (tokenId: number) => {
    if (!walletState.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setBattlingTokenId(tokenId);
      await contractService.initialize();
      await contractService.recordBattleWin(tokenId);
      
      toast.success("Battle victory recorded!");
      loadMyNFTs(); // Refresh NFTs
    } catch (error: any) {
      console.error("Error recording battle:", error);
      toast.error(error.message || "Failed to record battle");
    } finally {
      setBattlingTokenId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-hellfire bg-clip-text text-transparent">
          My Demonic Collection
        </h1>
        <p className="text-xl text-muted-foreground">
          Manage your NFTs - list, burn, or keep them forever
        </p>
      </div>

      {!walletState.isConnected ? (
        <Card className="p-12 text-center bg-card/50">
          <Flame className="h-16 w-16 mx-auto mb-4 text-primary animate-hellfire" />
          <h3 className="text-2xl font-bold mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to view and manage your NFTs
          </p>
        </Card>
      ) : loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : myNFTs.length === 0 ? (
        <Card className="p-12 text-center bg-card/50">
          <Flame className="h-16 w-16 mx-auto mb-4 text-primary animate-hellfire" />
          <h3 className="text-2xl font-bold mb-2">No NFTs Yet</h3>
          <p className="text-muted-foreground mb-6">
            Start minting to build your demonic collection
          </p>
          <Link to="/mint">
            <Button>Go to Mint</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {myNFTs.map((nft) => (
            <Card
              key={nft.tokenId}
              className="overflow-hidden bg-card/50 border-border hover:border-primary/50 transition-all hover:shadow-hellfire cursor-pointer"
              onClick={() => navigate(`/nft/${nft.tokenId}`)}
            >
              {nft.metadata?.image ? (
                <img
                  src={nft.metadata.image}
                  alt={nft.metadata.name}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="w-full h-64 bg-muted flex items-center justify-center"
                style={{ display: nft.metadata?.image ? 'none' : 'flex' }}
              >
                <span className="text-muted-foreground">
                  {nft.metadata?.image ? 'Failed to load image' : 'No Image'}
                </span>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">
                      {nft.metadata?.name || `Token #${nft.tokenId}`}
                    </h3>
                    {nft.rarityName && (
                      <Badge 
                        variant="outline" 
                        className={
                          nft.rarityName === 'Mythic' ? 'border-purple-500 text-purple-500' :
                          nft.rarityName === 'Legendary' ? 'border-yellow-500 text-yellow-500' :
                          nft.rarityName === 'Epic' ? 'border-pink-500 text-pink-500' :
                          nft.rarityName === 'Rare' ? 'border-blue-500 text-blue-500' :
                          'border-gray-500 text-gray-500'
                        }
                      >
                        {nft.rarityName}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Token ID: {nft.tokenId}</p>
                  
                  {nft.stats && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Level:</span>
                        <span className="font-semibold">{nft.stats.level}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Corruption:</span>
                        <span className="font-semibold">{nft.stats.corruption}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Trades:</span>
                        <span className="font-semibold">{nft.stats.tradeCount}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Battles Won:</span>
                        <span className="font-semibold">{nft.stats.battleWins}</span>
                      </div>
                    </div>
                  )}
                  
                  {nft.metadata?.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {nft.metadata.description}
                    </p>
                  )}
                </div>

                {nft.isListed && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Listed for</span>
                    <span className="text-primary font-bold">
                      {nft.listing?.price || "Unknown"} ETH
                    </span>
                  </div>
                )}
                
                {nft.stats && (
                  <div className="flex gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => handleLevelUp(nft.tokenId)}
                      disabled={levelingUpTokenId === nft.tokenId || nft.stats.level >= 100}
                    >
                      {levelingUpTokenId === nft.tokenId ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      )}
                      Level Up
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => handleBattleWin(nft.tokenId)}
                      disabled={battlingTokenId === nft.tokenId}
                    >
                      {battlingTokenId === nft.tokenId ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sword className="h-3 w-3 mr-1" />
                      )}
                      Battle Win
                    </Button>
                  </div>
                )}

                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {nft.isListed ? (
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      size="sm"
                      onClick={() => handleUnlistNFT(nft.tokenId)}
                    >
                      Unlist
                    </Button>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="flex-1" size="sm">
                          <DollarSign className="h-4 w-4 mr-1" />
                          List
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>List NFT for Sale</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="price">Price (ETH)</Label>
                            <Input
                              id="price"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={listingPrice}
                              onChange={(e) => setListingPrice(e.target.value)}
                            />
                          </div>
                          <Button 
                            className="w-full"
                            onClick={() => handleListNFT(nft.tokenId)}
                            disabled={isListing}
                          >
                            {isListing ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <DollarSign className="h-4 w-4 mr-2" />
                            )}
                            List for Sale
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="gap-1"
                        disabled={burningTokenId === nft.tokenId}
                      >
                        {burningTokenId === nft.tokenId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Burn
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Burn NFT
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          Are you sure you want to burn this NFT? This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            variant="destructive" 
                            className="flex-1"
                            onClick={() => handleBurnNFT(nft.tokenId)}
                            disabled={burningTokenId === nft.tokenId}
                          >
                            {burningTokenId === nft.tokenId ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Burn Forever
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyNFTs;
