import React, { useState, useEffect } from 'react';
import { ethers, formatEther } from "ethers";
import AuctionCard from '../components/AuctionCard';
import { useWallet } from '../contexts/WalletContext';


// --- Placeholder Data and Contract Details ---
// Replace with your actual contract address and ABI
const contractAddress = 'YOUR_CONTRACT_ADDRESS';
const contractABI = [
  // A minimal ABI for getAllAuctions. Replace with your full ABI.
  'function getAllAuctions() view returns (tuple(uint256 id, string title, uint256 highestBid, uint256 endTime, string image)[])'
];

// Placeholder auction data for UI development without a live contract
const placeholderAuctions = [
  {
    id: 1,
    title: 'Kashmiri Silk Carpet',
    highestBid: '1.5',
    endTime: new Date().getTime() + 86400000, // 1 day from now
    image: 'Qm...', // Example IPFS hash
  },
  {
    id: 2,
    title: 'Antique Persian Rug',
    highestBid: '2.3',
    endTime: new Date().getTime() + 172800000, // 2 days from now
    image: null, // To show placeholder
  },
  {
    id: 3,
    title: 'Modern Geometric Carpet',
    highestBid: '0.8',
    endTime: new Date().getTime() + 259200000, // 3 days from now
    image: 'Qm...',
  },
];
// --- End of Placeholder Data ---


const ExploreAuctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [filteredAuctions, setFilteredAuctions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { provider } = useWallet();


  useEffect(() => {
    const fetchAuctions = async () => {
      // Use placeholder data if no provider is available (e.g., wallet not connected)
      if (!provider || contractAddress === 'YOUR_CONTRACT_ADDRESS') {
        if (provider && contractAddress === 'YOUR_CONTRACT_ADDRESS') {
          alert('Please configure the contract address in src/pages/ExploreAuctions.js');
        }
        console.log('Using placeholder data as no wallet provider is found or contract address is not set.');
        setAuctions(placeholderAuctions);
        setFilteredAuctions(placeholderAuctions);
        setLoading(false);
        return;
      }

      try {
        // If a provider is found, attempt to fetch data from the smart contract
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        const fetchedAuctions = await contract.getAllAuctions();

        // Format auction data (e.g., convert BigNumber to string)
        const formattedAuctions = fetchedAuctions.map(auction => ({
          id: auction.id.toString(),
          title: auction.title,
          highestBid:  formatEther(auction.highestBid),
          endTime: new Date(auction.endTime.toNumber() * 1000),
          image: auction.image,
        }));

        setAuctions(formattedAuctions);
        setFilteredAuctions(formattedAuctions);
      } catch (error) {
        console.error('Error fetching auctions from smart contract:', error);
        // Fallback to placeholder data in case of an error
        setAuctions(placeholderAuctions);
        setFilteredAuctions(placeholderAuctions);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, [provider]);

  useEffect(() => {
    const results = auctions.filter(auction =>
      auction.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAuctions(results);
  }, [searchTerm, auctions]);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by carpet name..."
          className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading auctions...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuctions.map(auction => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExploreAuctions;