import React, { useState } from 'react';
import { Contract, parseEther } from "ethers";
import { useWallet } from '../contexts/WalletContext';
import { CONTRACT_ADDRESS as contractAddress, CONTRACT_ABI as contractABI } from '../config/contract';
import { uploadFileToWeb3Storage, uploadJsonToWeb3Storage } from '../utils/storage';

// --- Storage Configuration ---
const PINATA_JWT = process.env.REACT_APP_PINATA_JWT || '';

// --- End of Configuration ---

const PublishCarpet = () => {
  const { provider, account } = useWallet();
  const [formInput, setFormInput] = useState({ name: '', description: '', price: '', duration: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Upload helpers supporting Web3.Storage (preferred) or Pinata
  const uploadFile = async (file) => {
    try {
      return await uploadFileToWeb3Storage(file);
    } catch (_) {}
    if (PINATA_JWT) {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: { Authorization: `Bearer ${PINATA_JWT}` },
        body: form
      });
      if (!res.ok) throw new Error('Pinata file upload failed');
      const json = await res.json();
      return json.IpfsHash;
    }
    throw new Error('No storage provider configured. Set REACT_APP_WEB3_STORAGE_TOKEN or REACT_APP_PINATA_JWT');
  };

  const uploadJSON = async (obj) => {
    try {
      return await uploadJsonToWeb3Storage(obj);
    } catch (_) {}
    if (PINATA_JWT) {
      const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(obj)
      });
      if (!res.ok) throw new Error('Pinata JSON upload failed');
      const json = await res.json();
      return json.IpfsHash;
    }
    throw new Error('No storage provider configured. Set REACT_APP_WEB3_STORAGE_TOKEN or REACT_APP_PINATA_JWT');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, description, price, duration } = formInput;
    if (!name || !description || !price || !duration || !file) {
      alert('Please fill out all fields and upload an image.');
      return;
    }
    if (!provider || !account) {
      alert('Please connect your wallet.');
      return;
    }
    if (contractAddress === 'YOUR_CONTRACT_ADDRESS') {
      alert('Please configure the contract address in src/pages/PublishCarpet.js');
      return;
    }

    setLoading(true);

    try {
      setStatus('Uploading image to storage...');
      // 1. Upload image to IPFS (Web3.Storage/Pinata)
      const imageCid = await uploadFile(file);
      const imageUrl = `https://ipfs.io/ipfs/${imageCid}`;

      setStatus('Uploading metadata to storage...');
      // 2. Upload metadata to IPFS
      const metadataCid = await uploadJSON({ name, description, image: imageUrl });
      const metadataUrl = `https://ipfs.io/ipfs/${metadataCid}`;

      setStatus('Creating auction on-chain...');
      // 3. Call smart contract
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);
      const startPrice =  parseEther(price);
      const auctionDuration = parseInt(duration) * 60 * 60; // Convert hours to seconds

      const tx = await contract.createAuction(metadataUrl, startPrice, auctionDuration);
      await tx.wait();

      setSuccess(true);
      setFormInput({ name: '', description: '', price: '', duration: '' });
      setFile(null);
    } catch (error) {
      console.error('Error publishing carpet:', error);
      alert(`Failed to publish carpet: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold text-white mb-6">Publish a New Carpet</h1>
      
      {success && (
        <div className="bg-green-500 text-white p-4 rounded-lg mb-6">
          Carpet published successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Carpet Name"
            className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formInput.name}
            onChange={e => setFormInput({ ...formInput, name: e.target.value })}
          />
          <textarea
            placeholder="Description"
            rows="4"
            className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formInput.description}
            onChange={e => setFormInput({ ...formInput, description: e.target.value })}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Starting Bid (ETH)"
              step="0.01"
              min="0"
              className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formInput.price}
              onChange={e => setFormInput({ ...formInput, price: e.target.value })}
            />
            <input
              type="number"
              placeholder="Auction Duration (Hours)"
              min="1"
              className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formInput.duration}
              onChange={e => setFormInput({ ...formInput, duration: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-2">Upload Carpet Image</label>
            <input
              type="file"
              accept="image/*"
              className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
              onChange={handleFileChange}
            />
          </div>
        </div>
        <button 
          type="submit"
          className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-500"
          disabled={loading}
        >
          {loading ? (status || 'Publishing...') : 'Publish Carpet'}
        </button>
      </form>
    </div>
  );
};

export default PublishCarpet;
