import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WalletService, WalletState } from '@/lib/wallet';

interface WalletContextType {
  walletState: WalletState;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  switchToLocal: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    balance: null,
    isConnected: false,
    provider: null,
    signer: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletService = WalletService.getInstance();

  useEffect(() => {
    // Check if wallet is already connected on mount
    checkConnection();
    
    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        checkConnection();
      }
    };

    // Listen for chain changes
    const handleChainChanged = () => {
      checkConnection();
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    // Subscribe to wallet state changes
    const unsubscribe = walletService.subscribe((newState) => {
      setWalletState(newState);
    });

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
      unsubscribe();
    };
  }, []);

  const checkConnection = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await walletService.checkConnection();
    } catch (err) {
      console.error('Error checking connection:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await walletService.switchToLocalNetwork();
      await walletService.connectWallet();
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Error connecting wallet:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await walletService.disconnectWallet();
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect wallet');
      console.error('Error disconnecting wallet:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBalance = async () => {
    try {
      setError(null);
      await walletService.refreshBalance();
    } catch (err: any) {
      setError(err.message || 'Failed to refresh balance');
      console.error('Error refreshing balance:', err);
    }
  };

  const switchToLocal = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await walletService.switchToLocalNetwork();
    } catch (err: any) {
      setError(err.message || 'Failed to switch to local network');
      console.error('Error switching to local network:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const value: WalletContextType = {
    walletState,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    switchToLocal,
    isLoading,
    error,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
