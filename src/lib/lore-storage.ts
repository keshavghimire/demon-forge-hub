// Simple localStorage-based lore storage for demo purposes
import { DemonLore } from './ai-service';

const LORE_STORAGE_KEY = 'demon_lore_cache';

interface LoreCache {
  [tokenId: number]: DemonLore;
}

export class LoreStorage {
  static saveLore(tokenId: number, lore: DemonLore): void {
    try {
      const cache = this.getCache();
      cache[tokenId] = lore;
      localStorage.setItem(LORE_STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving lore to localStorage:', error);
    }
  }

  static getLore(tokenId: number): DemonLore | null {
    try {
      const cache = this.getCache();
      return cache[tokenId] || null;
    } catch (error) {
      console.error('Error getting lore from localStorage:', error);
      return null;
    }
  }

  static getAllLore(): LoreCache {
    return this.getCache();
  }

  private static getCache(): LoreCache {
    try {
      const stored = localStorage.getItem(LORE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading lore cache:', error);
      return {};
    }
  }

  static clearCache(): void {
    try {
      localStorage.removeItem(LORE_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing lore cache:', error);
    }
  }
}

