import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Flame, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { ContractService, NFTMetadata } from "@/lib/contract";
import { AIService, DemonLore } from "@/lib/ai-service";
import { LoreStorage } from "@/lib/lore-storage";
import { toast } from "sonner";

const Mint = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [generatedLore, setGeneratedLore] = useState<DemonLore | null>(null);
  const [isGeneratingLore, setIsGeneratingLore] = useState(false);
  
  const { walletState } = useWallet();
  const contractService = ContractService.getInstance();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleMint = async () => {
    if (!walletState.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!file) {
      toast.error("Please select an image or video");
      return;
    }

    try {
      setIsMinting(true);
      setGeneratedLore(null);
      
      // Initialize contract service
      await contractService.initialize();

      // Create basic metadata (name/description are optional now, AI will generate)
      // Image will be added by mintNFT function
      const metadata: NFTMetadata = {
        name: name.trim() || "Unnamed Demon",
        description: description.trim() || "A demonic creation from the forge...",
        image: "", // Will be set by mintNFT
        attributes: [
          {
            trait_type: "Created",
            value: new Date().toISOString(),
          },
        ],
      };

      // Mint NFT (rarity is calculated on-chain during mint)
      const tokenId = await contractService.mintNFT(metadata, file);
      
      // Get the rarity and stats from the contract
      const stats = await contractService.getDemonStats(tokenId);
      const rarityName = await contractService.getRarityName(tokenId);
      
      toast.success(`NFT minted! Generating AI lore...`);
      
      // Generate AI lore based on the minted NFT's rarity
      setIsGeneratingLore(true);
      try {
        const lore = await AIService.generateLore(
          tokenId,
          walletState.address!,
          stats.rarity
        );
        
        setGeneratedLore(lore);
        
        // Save lore to localStorage for persistence
        LoreStorage.saveLore(tokenId, lore);
        
        toast.success(`✨ ${lore.rarity} demon created: ${lore.name}!`);
      } catch (loreError) {
        console.error("Error generating lore:", loreError);
        toast.error("NFT minted, but lore generation failed");
      } finally {
        setIsGeneratingLore(false);
      }
      
    } catch (error: any) {
      console.error("Error minting NFT:", error);
      const errorMessage = error?.message || error?.reason || error?.error?.message || "Failed to mint NFT";
      console.error("Full error details:", error);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-hellfire bg-clip-text text-transparent">
            Forge Your NFT
          </h1>
          <p className="text-xl text-muted-foreground">
            Mint your demonic creation on Hardhat Local
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="p-8 bg-card/50 border-border">
            <Label htmlFor="file-upload" className="text-lg font-semibold mb-4 block">
              Upload Media
            </Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all hover:border-primary ${
                preview ? "border-primary" : "border-border"
              }`}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg shadow-hellfire"
                />
              ) : (
                <div className="space-y-4">
                  <Upload className="h-16 w-16 mx-auto text-primary animate-hellfire" />
                  <p className="text-muted-foreground">
                    Click to upload image or video
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG, GIF, MP4 (Max 100MB)
                  </p>
                </div>
              )}
            </div>
            <Input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,video/*"
            />
          </Card>

          {/* Metadata Section */}
          <Card className="p-8 bg-card/50 border-border">
            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-lg font-semibold mb-2">
                  NFT Name (Optional)
                </Label>
                <Input
                  id="name"
                  placeholder="AI will generate a name if left empty"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background border-border"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave empty for AI-generated demon name
                </p>
              </div>

              <div>
                <Label htmlFor="description" className="text-lg font-semibold mb-2">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="AI will generate a backstory if left empty"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-background border-border"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave empty for AI-generated demon lore
                </p>
              </div>

              <div>
                <Label htmlFor="price" className="text-lg font-semibold mb-2">
                  Initial Price (ETH) - Optional
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-background border-border"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave empty to mint without listing for sale
                </p>
              </div>

              <Button 
                className="w-full gap-2 shadow-hellfire" 
                size="lg"
                onClick={handleMint}
                disabled={isMinting || isGeneratingLore || !walletState.isConnected}
              >
                {isMinting || isGeneratingLore ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Flame className="h-5 w-5" />
                )}
                {isGeneratingLore 
                  ? "Generating Lore..." 
                  : isMinting 
                  ? "Minting..." 
                  : "Mint NFT"}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                AI will generate unique lore, rarity, and abilities for your demon
              </p>
              
              {generatedLore && (
                <Card className="p-6 bg-primary/10 border-primary/20 mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        {generatedLore.name}
                      </h3>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {generatedLore.rarity}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Role:</strong> {generatedLore.role} | <strong>Realm:</strong> {generatedLore.realm}
                      </p>
                      <p className="text-sm leading-relaxed">{generatedLore.backstory}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-semibold mb-2">Abilities:</p>
                      <div className="flex flex-wrap gap-2">
                        {generatedLore.abilities.map((ability, idx) => (
                          <Badge key={idx} variant="secondary">{ability}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm">
                        <strong>Personality:</strong> {generatedLore.personality}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Mint;
