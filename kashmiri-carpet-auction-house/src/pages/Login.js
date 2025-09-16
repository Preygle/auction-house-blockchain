import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

const Login = () => {
  const { connectWallet, account, role, chooseRole } = useWallet();
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const doLogin = async (asRole) => {
    setBusy(true);
    try {
      if (!window.ethereum) {
        alert('MetaMask not detected. You will be redirected to install it.');
        window.open('https://metamask.io/download/', '_blank');
        return;
      }
      // Connect only if not already connected
      if (!account) {
        await connectWallet();
      }
      // Persist role and navigate
      chooseRole(asRole);
      if (asRole === 'buyer') navigate('/explore');
      if (asRole === 'seller') navigate('/publish');
    } catch (e) {
      console.error('Login failed', e);
      alert('Login failed or was rejected in MetaMask.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-3xl bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12 text-white">
        <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-2">Welcome to Kashmiri Carpet Auction House</h1>
        <p className="text-center text-gray-300 mb-8">Login with MetaMask and choose your role to continue</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-700 rounded-xl p-6 border border-gray-600">
            <h2 className="text-2xl font-bold mb-2">Buyer</h2>
            <p className="text-gray-300 mb-6">Browse auctions, place bids, and manage your winnings.</p>
            <button onClick={() => doLogin('buyer')} disabled={busy || !window.ethereum} className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold disabled:opacity-50">
              {busy ? 'Connecting...' : 'Login as Buyer'}
            </button>
          </div>
          <div className="bg-gray-700 rounded-xl p-6 border border-gray-600">
            <h2 className="text-2xl font-bold mb-2">Seller</h2>
            <p className="text-gray-300 mb-6">Publish carpets and manage your auctions and sales.</p>
            <button onClick={() => doLogin('seller')} disabled={busy || !window.ethereum} className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold disabled:opacity-50">
              {busy ? 'Connecting...' : 'Login as Seller'}
            </button>
          </div>
        </div>
        {!window.ethereum && (
          <p className="text-center text-sm text-red-400 mt-6">MetaMask extension not detected. Please install it to continue.</p>
        )}
        {(account && role) && (
          <p className="text-center text-sm text-gray-400 mt-6">Connected as {role.toUpperCase()}</p>
        )}
      </div>
    </div>
  );
};

export default Login;


