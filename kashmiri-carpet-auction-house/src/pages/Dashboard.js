import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';

// --- Mock Data and Contract Details ---
const contractAddress = 'YOUR_CONTRACT_ADDRESS';
const contractABI = [
  // Assumed events and functions for dashboard
  'event AuctionCreated(uint256 indexed auctionId, address indexed seller, string metadataURI)',
  'event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount)',
  'event AuctionEnded(uint256 indexed auctionId, address winner, uint256 amount)',
  'function claimFunds(uint256 auctionId)',
  'function claimNFT(uint256 auctionId)',
];

const mockSellerAuctions = [
  { id: 1, title: 'Kashmiri Silk Carpet', status: 'Active', highestBid: '1.5 ETH', winner: null },
  { id: 4, title: 'Hand-Knotted Rug', status: 'Ended', highestBid: '2.1 ETH', winner: '0xABC...DEF' },
];

const mockBuyerAuctions = [
  { id: 2, title: 'Antique Persian Rug', myBid: '2.3 ETH', outcome: 'Highest Bidder', won: true },
  { id: 3, title: 'Modern Geometric Carpet', myBid: '0.7 ETH', outcome: 'Outbid', won: false },
];
// --- End of Mock Data ---

const Dashboard = () => {
  const { provider, account } = useWallet();
  const [view, setView] = useState('seller'); // 'seller' or 'buyer'
  const [sellerAuctions, setSellerAuctions] = useState([]);
  const [buyerAuctions, setBuyerAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!provider || !account || contractAddress === 'YOUR_CONTRACT_ADDRESS') {
        console.log('Using mock data for dashboard.');
        setSellerAuctions(mockSellerAuctions);
        setBuyerAuctions(mockBuyerAuctions);
        setLoading(false);
        return;
      }

      try {
        const contract = new ethers.Contract(contractAddress, contractABI, provider);

        // Fetch seller data
        const sellerFilter = contract.filters.AuctionCreated(null, account, null);
        const sellerEvents = await contract.queryFilter(sellerFilter);
        // ... logic to process events and get auction status ...
        setSellerAuctions(mockSellerAuctions); // Using mock data for now

        // Fetch buyer data
        const buyerFilter = contract.filters.BidPlaced(null, account, null);
        const buyerEvents = await contract.queryFilter(buyerFilter);
        // ... logic to process events and get auction outcomes ...
        setBuyerAuctions(mockBuyerAuctions); // Using mock data for now

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setSellerAuctions(mockSellerAuctions);
        setBuyerAuctions(mockBuyerAuctions);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [provider, account]);

  const handleClaimFunds = async (auctionId) => {
    // ... contract call to claimFunds(auctionId) ...
    alert(`Claiming funds for auction ${auctionId}`);
  };

  const handleClaimNFT = async (auctionId) => {
    // ... contract call to claimNFT(auctionId) ...
    alert(`Claiming NFT for auction ${auctionId}`);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-center mb-6 border-b border-gray-700">
        <button 
          onClick={() => setView('seller')} 
          className={`px-6 py-3 text-lg font-medium ${view === 'seller' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'}`}>
          Seller Dashboard
        </button>
        <button 
          onClick={() => setView('buyer')} 
          className={`px-6 py-3 text-lg font-medium ${view === 'buyer' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'}`}>
          Buyer Dashboard
        </button>
      </div>

      {loading ? (
        <p className="text-center">Loading dashboard...</p>
      ) : view === 'seller' ? (
        <SellerDashboard auctions={sellerAuctions} onClaimFunds={handleClaimFunds} />
      ) : (
        <BuyerDashboard auctions={buyerAuctions} onClaimNFT={handleClaimNFT} />
      )}
    </div>
  );
};

const SellerDashboard = ({ auctions, onClaimFunds }) => (
  <div>
    <h2 className="text-2xl font-bold mb-4 text-white">Your Published Auctions</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {auctions.map(auction => (
        <div key={auction.id} className="bg-gray-800 p-4 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold">{auction.title}</h3>
          <p>Status: {auction.status}</p>
          <p>Highest Bid: {auction.highestBid}</p>
          {auction.status === 'Ended' && <p>Winner: {auction.winner}</p>}
          {auction.status === 'Ended' && (
            <button 
              onClick={() => onClaimFunds(auction.id)}
              className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
              Claim Funds
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
);

const BuyerDashboard = ({ auctions, onClaimNFT }) => (
  <div>
    <h2 className="text-2xl font-bold mb-4 text-white">Your Bidding Activity</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {auctions.map(auction => (
        <div key={auction.id} className="bg-gray-800 p-4 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold">{auction.title}</h3>
          <p>Your Bid: {auction.myBid}</p>
          <p>Outcome: {auction.outcome}</p>
          {auction.won && (
            <button 
              onClick={() => onClaimNFT(auction.id)}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              Claim NFT
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default Dashboard;
