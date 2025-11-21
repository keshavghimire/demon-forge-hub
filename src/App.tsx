import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Mint from "./pages/Mint";
import MyNFTs from "./pages/MyNFTs";
import Marketplace from "./pages/Marketplace";
import NFTDetail from "./pages/NFTDetail";
import Faucet from "./pages/Faucet";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/mint" element={<Mint />} />
              <Route path="/my-nfts" element={<MyNFTs />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/nft/:tokenId" element={<NFTDetail />} />
              <Route path="/faucet" element={<Faucet />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
