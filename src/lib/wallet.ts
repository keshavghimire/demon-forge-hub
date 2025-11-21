import { ethers } from 'ethers';

export interface WalletState {
    address: string | null;
    balance: string | null;
    isConnected: boolean;
    provider: ethers.BrowserProvider | null;
    signer: ethers.JsonRpcSigner | null;
}

export class WalletService {
    private static instance: WalletService;
    private walletState: WalletState = {
        address: null,
        balance: null,
        isConnected: false,
        provider: null,
        signer: null,
    };

    private listeners: ((state: WalletState) => void)[] = [];

    static getInstance(): WalletService {
        if (!WalletService.instance) {
            WalletService.instance = new WalletService();
        }
        return WalletService.instance;
    }

    async connectWallet(): Promise<WalletState> {
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask is not installed');
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const accounts = await provider.send('eth_requestAccounts', []);

            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            const signer = provider.getSigner();
            const address = await signer.getAddress();
            const balance = await provider.getBalance(address);

            this.walletState = {
                address,
                balance: ethers.utils.formatEther(balance),
                isConnected: true,
                provider,
                signer,
            };

            this.notifyListeners();
            return this.walletState;
        } catch (error) {
            console.error('Error connecting wallet:', error);
            throw error;
        }
    }

    async disconnectWallet(): Promise<void> {
        this.walletState = {
            address: null,
            balance: null,
            isConnected: false,
            provider: null,
            signer: null,
        };
        this.notifyListeners();
    }

    async checkConnection(): Promise<WalletState> {
        try {
            if (typeof window.ethereum === 'undefined') {
                return this.walletState;
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const accounts = await provider.send('eth_accounts', []);

            if (accounts.length === 0) {
                return this.walletState;
            }

            const signer = provider.getSigner();
            const address = await signer.getAddress();
            const balance = await provider.getBalance(address);

            this.walletState = {
                address,
                balance: ethers.utils.formatEther(balance),
                isConnected: true,
                provider,
                signer,
            };

            this.notifyListeners();
            return this.walletState;
        } catch (error) {
            console.error('Error checking wallet connection:', error);
            return this.walletState;
        }
    }

    async switchToLocalNetwork(): Promise<void> {
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask is not installed');
            }

            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x539' }], // 1337 in hex
            });
        } catch (error: any) {
            // If the chain doesn't exist, add it
            if (error.code === 4902) {
                await this.addLocalNetwork();
            } else {
                throw error;
            }
        }
    }

    private async addLocalNetwork(): Promise<void> {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
                {
                    chainId: '0x539', // 1337 in hex
                    chainName: 'Hardhat Local',
                    rpcUrls: ['http://localhost:8545'],
                    nativeCurrency: {
                        name: 'ETH',
                        symbol: 'ETH',
                        decimals: 18,
                    },
                    blockExplorerUrls: [],
                },
            ],
        });
    }

    getWalletState(): WalletState {
        return { ...this.walletState };
    }

    subscribe(listener: (state: WalletState) => void): () => void {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.walletState));
    }

    async refreshBalance(): Promise<void> {
        if (!this.walletState.provider || !this.walletState.address) {
            return;
        }

        try {
            const balance = await this.walletState.provider.getBalance(this.walletState.address);
            this.walletState.balance = ethers.utils.formatEther(balance);
            this.notifyListeners();
        } catch (error) {
            console.error('Error refreshing balance:', error);
        }
    }
}

// Extend Window interface for TypeScript
declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: any[] }) => Promise<any>;
            on: (event: string, callback: (...args: any[]) => void) => void;
            removeListener: (event: string, callback: (...args: any[]) => void) => void;
        };
    }
}
