import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Filter, Loader2, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContext";
import { ContractService, Listing, NFTMetadata } from "@/lib/contract";
import { toast } from "sonner";

const Marketplace = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingTokenId, setBuyingTokenId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { walletState } = useWallet();
  const contractService = ContractService.getInstance();
  const navigate = useNavigate();

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      setLoading(true);
      await contractService.initialize();
      const activeListings = await contractService.getActiveListings();
      
      // Fetch metadata for each listing
      const listingsWithMetadata = await Promise.all(
        activeListings.map(async (listing) => {
          try {
            const metadata = await contractService.getNFTMetadata(listing.tokenId);
            return { ...listing, metadata };
          } catch (error) {
            console.error(`Error fetching metadata for token ${listing.tokenId}:`, error);
            return { ...listing, metadata: null };
          }
        })
      );
      
      setListings(listingsWithMetadata);
    } catch (error) {
      console.error("Error loading listings:", error);
      toast.error("Failed to load marketplace listings");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNFT = async (tokenId: number, price: string) => {
    if (!walletState.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setBuyingTokenId(tokenId);
      await contractService.initialize();
      await contractService.buyNFT(tokenId, price);
      
      toast.success("NFT purchased successfully!");
      loadListings(); // Refresh listings
    } catch (error: any) {
      console.error("Error buying NFT:", error);
      toast.error(error.message || "Failed to buy NFT");
    } finally {
      setBuyingTokenId(null);
    }
  };

  const filteredListings = listings.filter((listing) => {
    if (!listing.metadata) return false;
    return listing.metadata.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           listing.metadata.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-hellfire bg-clip-text text-transparent">
          NFT Marketplace
        </h1>
        <p className="text-xl text-muted-foreground">
          Discover and collect demonic NFTs from the abyss
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-8 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search NFTs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <Button variant="outline" className="gap-2" onClick={loadListings}>
          <Filter className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* NFT Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredListings.length === 0 ? (
        <Card className="p-12 text-center bg-card/50">
          <h3 className="text-2xl font-bold mb-2">
            {searchTerm ? "No NFTs found" : "No Listings Yet"}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm 
              ? "Try adjusting your search terms"
              : "Be the first to list an NFT on the marketplace"
            }
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredListings.map((listing) => (
            <Card
              key={listing.tokenId}
              className="overflow-hidden bg-card/50 border-border hover:border-primary/50 transition-all hover:shadow-hellfire cursor-pointer"
              onClick={() => navigate(`/nft/${listing.tokenId}`)}
            >
              {listing.metadata?.image ? (
                <img
                  src={listing.metadata.image}
                  alt={listing.metadata.name}
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
                style={{ display: listing.metadata?.image ? 'none' : 'flex' }}
              >
                <span className="text-muted-foreground">
                  {listing.metadata?.image ? 'Failed to load image' : 'No Image'}
                </span>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-lg">
                    {listing.metadata?.name || `Token #${listing.tokenId}`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                  </p>
                  {listing.metadata?.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {listing.metadata.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="text-lg font-bold text-primary">
                      {listing.price} ETH
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    className="shadow-hellfire"
                    onClick={() => handleBuyNFT(listing.tokenId, listing.price)}
                    disabled={buyingTokenId === listing.tokenId || !walletState.isConnected}
                  >
                    {buyingTokenId === listing.tokenId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-4 w-4" />
                    )}
                    Buy
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
