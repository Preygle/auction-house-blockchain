import React, { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [role, setRole] = useState(null); // 'buyer' | 'seller'

  const requiredChainId = Number(process.env.REACT_APP_CHAIN_ID || 0); // 0 disables guard

  const connectWallet = async () => {
    console.log('Attempting to connect wallet...');
    if (!window.ethereum) {
      console.error('MetaMask not found');
      alert("Please install MetaMask to use this feature.");
      return;
    }
    try {
      // Prefer direct request for broader compatibility
      const requested = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = Array.isArray(requested) ? requested : [];
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);
      if (accounts.length > 0) {
        const next = accounts[0];
        setAccount(next);
        localStorage.setItem('kcah_account', next);

        // Network guard with optional switch
        if (requiredChainId) {
          try {
            const network = await browserProvider.getNetwork();
            const currentId = Number(network.chainId);
            if (currentId !== requiredChainId) {
              try {
                await window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: '0x' + requiredChainId.toString(16) }]
                });
              } catch (switchErr) {
                console.warn('Network switch rejected or failed', switchErr);
                alert('Please switch to the required network in MetaMask.');
              }
            }
          } catch (e) {
            console.error('Failed to check/switch network', e);
          }
        }
      }
    } catch (error) {
      if (error && error.code === 4001) {
        // User rejected
        console.warn('User rejected connection');
      } else {
        console.error('Error connecting to MetaMask:', error);
      }
    }
  };

  useEffect(() => {
    const checkWalletIsConnected = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(provider);
          const accounts = await provider.send("eth_accounts", []);
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        } catch (error) {
          console.error("Error checking for wallet connection", error);
        }
      }
    };
    checkWalletIsConnected();

    if(window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          localStorage.setItem('kcah_account', accounts[0]);
        } else {
          setAccount(null);
          setRole(null);
          localStorage.removeItem('kcah_account');
          localStorage.removeItem('kcah_role');
        }
      });
    }
  }, []);

  // Load persisted role/account
  useEffect(() => {
    const savedRole = localStorage.getItem('kcah_role');
    if (savedRole) setRole(savedRole);
    const savedAccount = localStorage.getItem('kcah_account');
    if (savedAccount && !account) setAccount(savedAccount);
  }, []);

  const chooseRole = (newRole) => {
    setRole(newRole);
    localStorage.setItem('kcah_role', newRole);
  };

  const logout = () => {
    setRole(null);
    localStorage.removeItem('kcah_role');
  };

  const shortenedAddress = account
    ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
    : null;

  return (
    <WalletContext.Provider value={{ account, shortenedAddress, connectWallet, provider, role, chooseRole, logout, requiredChainId }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  return useContext(WalletContext);
};
