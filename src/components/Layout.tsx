import { ReactNode } from "react";
import Navbar from "./Navbar";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>{children}</main>
      <footer className="border-t border-border py-8 mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              © 2025 Demons NFT Marketplace. Running on Hardhat Local Network.
            </p>
            <p className="text-xs text-muted-foreground">
              For testing purposes only. No real value.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
