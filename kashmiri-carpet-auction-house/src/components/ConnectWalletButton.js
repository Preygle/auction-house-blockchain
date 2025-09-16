import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';

const ConnectWalletButton = ({ onConnected }) => {
  const { account, shortenedAddress, connectWallet, role, chooseRole } = useWallet();
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleConnect = async () => {
    setBusy(true);
    try {
      if (!window.ethereum) {
        window.open('https://metamask.io/download/', '_blank');
        return;
      }
      await connectWallet();
      if (!role) setShowRolePicker(true);
    } finally {
      setBusy(false);
    }
  };

  const selectRole = async (r) => {
    chooseRole(r);
    setShowRolePicker(false);
    if (typeof onConnected === 'function') onConnected(r);
  };

  if (account) {
    return (
      <div className="flex items-center space-x-2">
        <button onClick={() => setShowRolePicker((s) => !s)} className="text-sm text-gray-300 hidden sm:inline underline">
          {role ? role.toUpperCase() : 'CHOOSE ROLE'}
        </button>
        <span className="bg-gray-800 px-3 py-1 rounded-full text-sm">{shortenedAddress}</span>
        {showRolePicker && (
          <div className="absolute right-0 mt-10 w-56 bg-gray-800 text-white rounded-lg shadow-xl p-4 z-50">
            <p className="mb-3 text-sm text-gray-300">Select your role</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => selectRole('buyer')} className="bg-gray-700 hover:bg-gray-600 rounded-md py-2">Buyer</button>
              <button onClick={() => selectRole('seller')} className="bg-gray-700 hover:bg-gray-600 rounded-md py-2">Seller</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleConnect}
        disabled={busy}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
      >
        {busy ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {showRolePicker && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-800 text-white rounded-lg shadow-xl p-4 z-50">
          <p className="mb-3 text-sm text-gray-300">Select your role</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => selectRole('buyer')} className="bg-gray-700 hover:bg-gray-600 rounded-md py-2">Buyer</button>
            <button onClick={() => selectRole('seller')} className="bg-gray-700 hover:bg-gray-600 rounded-md py-2">Seller</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectWalletButton;


