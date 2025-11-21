import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Flame, 
  Trash2, 
  Loader2, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  Sword, 
  Sparkles,
  ArrowLeft,
  ShoppingCart
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContext";
import { ContractService, NFTMetadata, Listing, DemonStats } from "@/lib/contract";
import { LoreStorage } from "@/lib/lore-storage";
import { DemonLore } from "@/lib/ai-service";
import { toast } from "sonner";

const NFTDetail = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const navigate = useNavigate();
  const [nft, setNft] = useState<{
    tokenId: number;
    metadata: NFTMetadata | null;
    stats?: DemonStats;
    rarityName?: string;
    listing?: Listing;
    owner?: string;
    isOwner?: boolean;
    lore?: DemonLore;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [listingPrice, setListingPrice] = useState("");
  const [isListing, setIsListing] = useState(false);
  const [levelingUp, setLevelingUp] = useState(false);
  const [battling, setBattling] = useState(false);
  const [buying, setBuying] = useState(false);
  const [burning, setBurning] = useState(false);

  const { walletState } = useWallet();
  const contractService = ContractService.getInstance();

  useEffect(() => {
    if (tokenId) {
      loadNFT();
    }
  }, [tokenId, walletState.address]);

  const loadNFT = async () => {
    if (!tokenId) return;

    try {
      setLoading(true);
      await contractService.initialize();

      const tokenIdNum = parseInt(tokenId);

      // Fetch metadata
      let metadata = await contractService.getNFTMetadata(tokenIdNum);

      // Check for AI-generated lore
      const lore = LoreStorage.getLore(tokenIdNum);
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

      // Fetch stats
      let stats: DemonStats | undefined;
      let rarityName: string | undefined;
      try {
        stats = await contractService.getDemonStats(tokenIdNum);
        rarityName = await contractService.getRarityName(tokenIdNum);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }

      // Fetch owner
      let owner: string | undefined;
      let isOwner = false;
      try {
        owner = await contractService.getOwner(tokenIdNum);
        isOwner = walletState.address?.toLowerCase() === owner?.toLowerCase();
      } catch (error) {
        console.error("Error fetching owner:", error);
      }

      // Fetch listing if exists
      let listing: Listing | undefined;
      try {
        listing = await contractService.getListing(tokenIdNum);
      } catch (error) {
        console.error("Error fetching listing:", error);
      }

      setNft({
        tokenId: tokenIdNum,
        metadata,
        stats,
        rarityName,
        listing,
        owner,
        isOwner,
        lore: lore || undefined,
      });
    } catch (error) {
      console.error("Error loading NFT:", error);
      toast.error("Failed to load NFT details");
    } finally {
      setLoading(false);
    }
  };

  const handleLevelUp = async () => {
    if (!nft || !walletState.isConnected) return;

    try {
      setLevelingUp(true);
      await contractService.initialize();
      await contractService.levelUp(nft.tokenId);
      toast.success("Demon leveled up!");
      loadNFT();
    } catch (error: any) {
      toast.error(error.message || "Failed to level up");
    } finally {
      setLevelingUp(false);
    }
  };

  const handleBattleWin = async () => {
    if (!nft || !walletState.isConnected) return;

    try {
      setBattling(true);
      await contractService.initialize();
      await contractService.recordBattleWin(nft.tokenId);
      toast.success("Battle victory recorded!");
      loadNFT();
    } catch (error: any) {
      toast.error(error.message || "Failed to record battle");
    } finally {
      setBattling(false);
    }
  };

  const handleListNFT = async () => {
    if (!nft || !listingPrice || parseFloat(listingPrice) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    try {
      setIsListing(true);
      await contractService.initialize();
      await contractService.listNFT(nft.tokenId, listingPrice);
      toast.success("NFT listed for sale!");
      setListingPrice("");
      loadNFT();
    } catch (error: any) {
      toast.error(error.message || "Failed to list NFT");
    } finally {
      setIsListing(false);
    }
  };

  const handleUnlistNFT = async () => {
    if (!nft) return;

    try {
      await contractService.initialize();
      await contractService.unlistNFT(nft.tokenId);
      toast.success("NFT unlisted!");
      loadNFT();
    } catch (error: any) {
      toast.error(error.message || "Failed to unlist NFT");
    }
  };

  const handleBuyNFT = async () => {
    if (!nft?.listing) return;

    try {
      setBuying(true);
      await contractService.initialize();
      await contractService.buyNFT(nft.tokenId, nft.listing.price);
      toast.success("NFT purchased successfully!");
      loadNFT();
    } catch (error: any) {
      toast.error(error.message || "Failed to buy NFT");
    } finally {
      setBuying(false);
    }
  };

  const handleBurnNFT = async () => {
    if (!nft) return;

    try {
      setBurning(true);
      await contractService.initialize();
      await contractService.burnNFT(nft.tokenId);
      toast.success("NFT burned!");
      navigate("/my-nfts");
    } catch (error: any) {
      toast.error(error.message || "Failed to burn NFT");
    } finally {
      setBurning(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <Card className="p-12 bg-card/50">
          <h2 className="text-2xl font-bold mb-4">NFT Not Found</h2>
          <p className="text-muted-foreground mb-6">The NFT you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const getRarityColor = (rarity?: string) => {
    if (!rarity) return "border-gray-500 text-gray-500";
    switch (rarity) {
      case "Mythic":
        return "border-purple-500 text-purple-500 bg-purple-500/10";
      case "Legendary":
        return "border-yellow-500 text-yellow-500 bg-yellow-500/10";
      case "Epic":
        return "border-pink-500 text-pink-500 bg-pink-500/10";
      case "Rare":
        return "border-blue-500 text-blue-500 bg-blue-500/10";
      default:
        return "border-gray-500 text-gray-500 bg-gray-500/10";
    }
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Section */}
        <Card className="p-6 bg-card/50">
          {nft.metadata?.image ? (
            <img
              src={nft.metadata.image}
              alt={nft.metadata.name}
              className="w-full rounded-lg shadow-hellfire"
            />
          ) : (
            <div className="w-full h-96 bg-muted flex items-center justify-center rounded-lg">
              <span className="text-muted-foreground">No Image</span>
            </div>
          )}
        </Card>

        {/* Details Section */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-4xl font-bold">
                {nft.metadata?.name || `Token #${nft.tokenId}`}
              </h1>
              {nft.rarityName && (
                <Badge className={`text-lg px-4 py-2 ${getRarityColor(nft.rarityName)}`}>
                  {nft.rarityName}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">Token ID: {nft.tokenId}</p>
            {nft.owner && (
              <p className="text-sm text-muted-foreground mt-2">
                Owner: {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
              </p>
            )}
          </div>

          {/* Description */}
          {nft.metadata?.description && (
            <Card className="p-6 bg-card/50">
              <h2 className="text-xl font-bold mb-3">Description</h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {nft.metadata.description}
              </p>
            </Card>
          )}

          {/* Stats */}
          {nft.stats && (
            <Card className="p-6 bg-card/50">
              <h2 className="text-xl font-bold mb-4">Demon Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="text-2xl font-bold">{nft.stats.level}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Corruption</p>
                  <p className="text-2xl font-bold">{nft.stats.corruption}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trades</p>
                  <p className="text-2xl font-bold">{nft.stats.tradeCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Battles Won</p>
                  <p className="text-2xl font-bold">{nft.stats.battleWins}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Lore & Abilities */}
          {nft.lore && (
            <Card className="p-6 bg-card/50">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Demon Lore
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-semibold">{nft.lore.role}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Realm</p>
                  <p className="font-semibold">{nft.lore.realm}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Personality</p>
                  <p className="font-semibold">{nft.lore.personality}</p>
                </div>
                {nft.lore.abilities && nft.lore.abilities.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Abilities</p>
                    <div className="flex flex-wrap gap-2">
                      {nft.lore.abilities.map((ability, idx) => (
                        <Badge key={idx} variant="secondary">{ability}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Attributes */}
          {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
            <Card className="p-6 bg-card/50">
              <h2 className="text-xl font-bold mb-4">Attributes</h2>
              <div className="grid grid-cols-2 gap-3">
                {nft.metadata.attributes.map((attr, idx) => (
                  <div key={idx} className="border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{attr.trait_type}</p>
                    <p className="font-semibold">{attr.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Actions */}
          <Card className="p-6 bg-card/50">
            <h2 className="text-xl font-bold mb-4">Actions</h2>
            
            {/* Listing Status */}
            {nft.listing?.active && (
              <div className="mb-4 p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Listed for</p>
                <p className="text-2xl font-bold text-primary">{nft.listing.price} ETH</p>
                {!nft.isOwner && walletState.isConnected && (
                  <Button
                    className="w-full mt-4"
                    onClick={handleBuyNFT}
                    disabled={buying}
                  >
                    {buying ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    Buy NFT
                  </Button>
                )}
                {nft.isOwner && (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={handleUnlistNFT}
                  >
                    Unlist NFT
                  </Button>
                )}
              </div>
            )}

            {/* Owner Actions */}
            {nft.isOwner && !nft.listing?.active && (
              <div className="space-y-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <DollarSign className="h-4 w-4 mr-2" />
                      List for Sale
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
                        onClick={handleListNFT}
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

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleLevelUp}
                    disabled={levelingUp || (nft.stats?.level ?? 0) >= 100}
                  >
                    {levelingUp ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TrendingUp className="h-4 w-4 mr-2" />
                    )}
                    Level Up
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBattleWin}
                    disabled={battling}
                  >
                    {battling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sword className="h-4 w-4 mr-2" />
                    )}
                    Battle Win
                  </Button>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Burn NFT
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
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={handleBurnNFT}
                        disabled={burning}
                      >
                        {burning ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Burn Forever
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {!nft.isOwner && !nft.listing?.active && (
              <p className="text-sm text-muted-foreground text-center">
                You don't own this NFT
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NFTDetail;

