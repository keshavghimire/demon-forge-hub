import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink, Zap, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const Faucet = () => {
  const [copied, setCopied] = useState(false);
  const faucetUrl = "https://faucet.polygon.technology/";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      number: 1,
      title: "Connect Your Wallet",
      description: "Make sure MetaMask is connected to Hardhat Local network",
    },
    {
      number: 2,
      title: "Visit the Faucet",
      description: "Click the button below to access the official Polygon faucet",
    },
    {
      number: 3,
      title: "Request Test Tokens",
      description: "Import a test account with 10,000 ETH for local testing",
    },
    {
      number: 4,
      title: "Start Trading",
      description: "Use your test tokens to mint, buy, and sell NFTs on Demons",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-hellfire bg-clip-text text-transparent">
            Get Test Tokens
          </h1>
          <p className="text-xl text-muted-foreground">
            Get test ETH for local Hardhat network
          </p>
        </div>

        {/* Main CTA Card */}
        <Card className="p-8 mb-12 bg-gradient-abyss border-primary/30 shadow-hellfire">
          <div className="text-center space-y-6">
            <Zap className="h-16 w-16 mx-auto text-primary animate-hellfire" />
            <div>
              <h2 className="text-2xl font-bold mb-2">Hardhat Local Test Accounts</h2>
              <p className="text-muted-foreground">
                Import a test account with 10,000 ETH for local testing
              </p>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                size="lg"
                className="gap-2 shadow-hellfire"
                onClick={() => window.open("/COPY_THIS_PRIVATE_KEY.txt", "_blank")}
              >
                <ExternalLink className="h-5 w-5" />
                View Test Account Info
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2"
                onClick={() => copyToClipboard(faucetUrl)}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5" />
                    Copy URL
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Steps Guide */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-center mb-8">How to Get Test Tokens</h3>
          <div className="grid gap-6">
            {steps.map((step) => (
              <Card
                key={step.number}
                className="p-6 bg-card/50 border-border hover:border-primary/30 transition-all"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-hellfire flex items-center justify-center text-xl font-bold shadow-hellfire">
                    {step.number}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-1">{step.title}</h4>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Network Info */}
        <Card className="p-6 mt-12 bg-card/50 border-border">
          <h4 className="font-bold mb-4">Hardhat Local Network Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network Name:</span>
              <span className="font-mono">Hardhat Local</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chain ID:</span>
              <span className="font-mono">1337</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Currency:</span>
              <span className="font-mono">ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">RPC URL:</span>
              <span className="font-mono text-xs break-all">
                http://localhost:8545
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Faucet;
