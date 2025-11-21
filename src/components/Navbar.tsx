import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Skull } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const location = useLocation();
  const { walletState, connectWallet, disconnectWallet, isLoading } = useWallet();

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/mint", label: "Mint" },
    { path: "/my-nfts", label: "My NFTs" },
    { path: "/marketplace", label: "Marketplace" },
    { path: "/faucet", label: "Faucet" },
  ];

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Skull className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-hellfire bg-clip-text text-transparent">
              DEMONS
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === item.path
                    ? "text-primary"
                    : "text-foreground/80"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {walletState.isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Wallet className="h-4 w-4" />
                  {formatAddress(walletState.address!)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  <div className="text-sm">
                    <div className="font-medium">{formatAddress(walletState.address!)}</div>
                    <div className="text-muted-foreground">
                      {walletState.balance ? `${parseFloat(walletState.balance).toFixed(4)} ETH` : 'Loading...'}
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={disconnectWallet}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={connectWallet}
              disabled={isLoading}
              className="gap-2"
            >
              <Wallet className="h-4 w-4" />
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
