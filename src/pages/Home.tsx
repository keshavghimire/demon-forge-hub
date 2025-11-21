import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Flame, Skull, Zap, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ContractService, MarketplaceStats } from "@/lib/contract";
import heroImage from "@/assets/hero-demons.jpg";

const Home = () => {
  const [stats, setStats] = useState<MarketplaceStats>({
    totalMinted: 0,
    totalBurned: 0,
    totalSold: 0,
    activeListings: 0,
  });
  const [loading, setLoading] = useState(true);
  
  const contractService = ContractService.getInstance();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      await contractService.initialize();
      const marketplaceStats = await contractService.getMarketplaceStats();
      setStats(marketplaceStats);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Flame,
      title: "Mint NFTs",
      description: "Create your own demonic NFT collection with IPFS storage",
    },
    {
      icon: Skull,
      title: "Burn Tokens",
      description: "Send your NFTs to the abyss and remove them forever",
    },
    {
      icon: Zap,
      title: "Trade NFTs",
      description: "Buy and sell NFTs on local Hardhat network",
    },
  ];

  const statsData = [
    { label: "NFTs Minted", value: loading ? "..." : stats.totalMinted.toString() },
    { label: "Total Burned", value: loading ? "..." : stats.totalBurned.toString() },
    { label: "Active Listings", value: loading ? "..." : stats.activeListings.toString() },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Demons NFT Hero"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-abyss" />
        </div>

        <div className="relative z-10 text-center space-y-6 px-4">
          <h1 className="text-6xl md:text-8xl font-bold animate-hellfire">
            <span className="bg-gradient-hellfire bg-clip-text text-transparent">
              DEMONS
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 max-w-2xl mx-auto">
            Forge, trade, and destroy NFTs in the darkest marketplace on Hardhat Local
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/mint">
              <Button size="lg" className="gap-2 shadow-hellfire">
                <Flame className="h-5 w-5" />
                Start Minting
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button size="lg" variant="outline" className="gap-2">
                Explore Market
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {statsData.map((stat) => (
              <Card key={stat.label} className="p-6 text-center bg-gradient-abyss border-primary/20">
                <p className="text-4xl font-bold text-primary mb-2">
                  {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  ) : (
                    stat.value
                  )}
                </p>
                <p className="text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-hellfire bg-clip-text text-transparent">
            Unleash the Power
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="p-8 bg-card/50 border-border hover:border-primary/50 transition-all hover:shadow-hellfire"
              >
                <feature.icon className="h-12 w-12 text-primary mb-4 animate-hellfire" />
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-abyss">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Join the Abyss?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect your wallet and start your journey in the darkest NFT marketplace
          </p>
          <Link to="/faucet">
            <Button size="lg" variant="outline" className="gap-2">
              <Zap className="h-5 w-5" />
              Get Test Tokens
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
