// Local AI Service for Demon Lore Generation
// Run with: node server/ai-service.js
// This creates a simple Express server for AI lore generation

import express from 'express';
import cors from 'cors';
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Fallback lore templates if OpenAI is not configured
const FALLBACK_LORES = {
  roles: ['Shadow Assassin', 'Inferno Warrior', 'Abyss Mage', 'Void Warlock', 'Chaos Demon'],
  realms: ['Inferno', 'Abyss', 'Shadowlands', 'Void Realm', 'Chaos Dimension'],
  abilities: [
    ['Shadow Step', 'Dark Strike', 'Soul Drain'],
    ['Fire Blast', 'Inferno Shield', 'Hellfire'],
    ['Abyssal Bolt', 'Dark Magic', 'Soul Bind'],
    ['Void Rift', 'Darkness Control', 'Reality Tear'],
    ['Chaos Storm', 'Reality Warp', 'Destruction']
  ]
};

// Generate deterministic lore based on seed
function generateDeterministicLore(tokenId, minterAddress, rarity) {
  const seed = tokenId + parseInt(minterAddress.slice(2, 10), 16);
  const roleIndex = seed % FALLBACK_LORES.roles.length;
  const realmIndex = (seed * 7) % FALLBACK_LORES.realms.length;
  const abilityIndex = seed % FALLBACK_LORES.abilities.length;
  
  const role = FALLBACK_LORES.roles[roleIndex];
  const realm = FALLBACK_LORES.realms[realmIndex];
  const abilities = FALLBACK_LORES.abilities[abilityIndex];
  
  const rarityNames = {
    0: 'Common',
    1: 'Rare',
    2: 'Epic',
    3: 'Legendary',
    4: 'Mythic'
  };
  
  const rarityName = rarityNames[rarity] || 'Common';
  
  const backstory = `Born in the depths of ${realm}, this ${rarityName.toLowerCase()} demon emerged from the shadows with a singular purpose. Forged in chaos and tempered by darkness, it has wandered the realms for eons, collecting souls and growing in power. Its origin remains a mystery, but its presence is felt by all who cross its path.`;
  
  const personality = seed % 2 === 0 ? 'Aggressive and Chaotic' : 'Cunning and Mysterious';
  
  return {
    name: `${role} of ${realm}`,
    backstory,
    role,
    realm,
    abilities,
    personality,
    rarity: rarityName,
    tags: [rarityName.toLowerCase(), role.toLowerCase(), realm.toLowerCase(), personality.toLowerCase()]
  };
}

// Generate lore using OpenAI (if API key is available)
async function generateAILore(tokenId, minterAddress, rarity) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    console.log('No OpenAI API key found, using fallback lore generation');
    return generateDeterministicLore(tokenId, minterAddress, rarity);
  }
  
  try {
    const rarityNames = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
    const rarityName = rarityNames[rarity] || 'Common';
    
    // Create a deterministic seed for consistent lore
    const seed = tokenId + parseInt(minterAddress.slice(2, 10), 16);
    
    const prompt = `Create a unique fantasy demon character with the following specifications:
- Rarity: ${rarityName}
- Token ID: ${tokenId}
- Seed: ${seed}

Generate:
1. A unique demon name (fantasy-themed, 2-3 words)
2. A detailed backstory (2-3 paragraphs) about its origin, past, and purpose
3. A role/class (e.g., Shadow Assassin, Inferno Warrior, Abyss Mage)
4. 3-5 unique abilities/powers
5. Origin realm (e.g., Inferno, Abyss, Shadowlands)
6. Personality traits (2-3 words)
7. Tags for filtering (array of relevant keywords)

Return ONLY valid JSON in this exact format:
{
  "name": "Demon Name",
  "backstory": "Full backstory text...",
  "role": "Role/Class",
  "realm": "Origin Realm",
  "abilities": ["Ability 1", "Ability 2", "Ability 3"],
  "personality": "Trait 1, Trait 2",
  "tags": ["tag1", "tag2", "tag3"]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a fantasy lore generator. Always return valid JSON only, no markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const lore = JSON.parse(jsonContent);
    
    // Add rarity to the lore
    lore.rarity = rarityName;
    if (!lore.tags) lore.tags = [];
    lore.tags.push(rarityName.toLowerCase());
    
    return lore;
  } catch (error) {
    console.error('Error generating AI lore:', error);
    console.log('Falling back to deterministic lore generation');
    return generateDeterministicLore(tokenId, minterAddress, rarity);
  }
}

// API endpoint to generate lore
app.post('/api/generate-lore', async (req, res) => {
  try {
    const { tokenId, minterAddress, rarity } = req.body;
    
    if (tokenId === undefined || !minterAddress || rarity === undefined) {
      return res.status(400).json({ error: 'Missing required fields: tokenId, minterAddress, rarity' });
    }
    
    console.log(`Generating lore for token ${tokenId}, rarity ${rarity}`);
    const lore = await generateAILore(tokenId, minterAddress, rarity);
    
    res.json(lore);
  } catch (error) {
    console.error('Error in /api/generate-lore:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'AI Lore Generator' });
});

app.listen(PORT, () => {
  console.log(`🤖 AI Lore Service running on http://localhost:${PORT}`);
  console.log(`📝 Generate lore: POST http://localhost:${PORT}/api/generate-lore`);
  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️  No OPENAI_API_KEY found - using fallback lore generation');
  }
});

