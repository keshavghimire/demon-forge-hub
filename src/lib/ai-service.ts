// AI Service Client for generating demon lore
export interface DemonLore {
  name: string;
  backstory: string;
  role: string;
  realm: string;
  abilities: string[];
  personality: string;
  rarity: string;
  tags: string[];
}

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:3001';

export class AIService {
  static async generateLore(
    tokenId: number,
    minterAddress: string,
    rarity: number
  ): Promise<DemonLore> {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/generate-lore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId,
          minterAddress,
          rarity,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      const lore = await response.json();
      return lore;
    } catch (error) {
      console.error('Error generating lore:', error);
      // Return fallback lore if service is unavailable
      return this.getFallbackLore(tokenId, minterAddress, rarity);
    }
  }

  private static getFallbackLore(
    tokenId: number,
    minterAddress: string,
    rarity: number
  ): DemonLore {
    const rarityNames = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
    const rarityName = rarityNames[rarity] || 'Common';
    
    const seed = tokenId + parseInt(minterAddress.slice(2, 10), 16);
    const roles = ['Shadow Assassin', 'Inferno Warrior', 'Abyss Mage', 'Void Warlock', 'Chaos Demon'];
    const realms = ['Inferno', 'Abyss', 'Shadowlands', 'Void Realm', 'Chaos Dimension'];
    
    const role = roles[seed % roles.length];
    const realm = realms[(seed * 7) % realms.length];
    
    return {
      name: `${role} of ${realm}`,
      backstory: `Born in the depths of ${realm}, this ${rarityName.toLowerCase()} demon emerged from the shadows with a singular purpose. Forged in chaos and tempered by darkness, it has wandered the realms for eons, collecting souls and growing in power.`,
      role,
      realm,
      abilities: ['Shadow Step', 'Dark Strike', 'Soul Drain'],
      personality: seed % 2 === 0 ? 'Aggressive and Chaotic' : 'Cunning and Mysterious',
      rarity: rarityName,
      tags: [rarityName.toLowerCase(), role.toLowerCase(), realm.toLowerCase()],
    };
  }
}

