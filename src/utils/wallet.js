import { ethers } from 'ethers';

export const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Request wallet permissions to switch accounts
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [
            {
              eth_accounts: {},
            },
          ],
        });
  
        // Get the user's wallet address
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
  
        const walletAddress = accounts[0];
        return { walletAddress };
      } catch (error) {
        console.error('Error connecting to wallet:', error);
        throw error;
      }
    } else {
      alert('MetaMask is not installed. Please install it to use this feature.');
      throw new Error('MetaMask not installed');
    }
  };

  // utils/wallet.js

export const disconnectWallet = async () => {
    if (window.ethereum) {
      try {
        // Clear any stored wallet data if necessary
        localStorage.removeItem('walletAddress');
        console.log('Disconnected from MetaMask');
      } catch (error) {
        console.error('Error disconnecting from wallet:', error);
        throw error;
      }
    } else {
      console.error('MetaMask is not installed.');
      throw new Error('MetaMask not installed');
    }
  };