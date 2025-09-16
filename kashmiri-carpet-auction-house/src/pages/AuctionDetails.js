import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ethers, formatEther, parseEther } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import Countdown from '../components/Countdown';
import { CONTRACT_ADDRESS as contractAddress, CONTRACT_ABI as contractABI } from '../config/contract';
import { firstGatewayUrl, fetchIpfsJson } from '../utils/ipfs';

// --- Mock Data and Contract Details ---

const mockAuctionDetails = {
  id: 1,
  title: 'Kashmiri Silk Carpet',
  description: 'A beautiful hand-woven carpet made with the finest silk threads, featuring traditional Kashmiri patterns.',
  seller: '0x1234567890123456789012345678901234567890',
  highestBid: '1.5',
  highestBidder: '0x0987654321098765432109876543210987654321',
  endTime: new Date().getTime() + 86400000, // 1 day from now
  active: true,
  image: 'https://via.placeholder.com/800x600',
};

const mockBidHistory = [
  { bidder: '0xABC...DEF', amount: '1.2 ETH' },
  { bidder: '0xGHI...JKL', amount: '1.0 ETH' },
  { bidder: '0xMNO...PQR', amount: '0.8 ETH' },
];
// --- End of Mock Data ---

const AuctionDetails = () => {
  const { id } = useParams();
  const { provider, account } = useWallet();
  const [auction, setAuction] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuctionDetails = async () => {
      if (!provider || contractAddress === 'YOUR_CONTRACT_ADDRESS') {
        if (provider && contractAddress === 'YOUR_CONTRACT_ADDRESS') {
          alert('Please configure the contract address in src/pages/AuctionDetails.js');
        }
        console.log('Using mock data as no wallet provider is found or contract address is not set.');
        setAuction(mockAuctionDetails);
        setBidHistory(mockBidHistory);
        setLoading(false);
        return;
      }

      try {
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        
        // Fetch auction details
        const details = await contract.getAuctionById(id);
        const base = {
          id: details.id.toString(),
          title: details.title,
          description: details.description,
          seller: details.seller,
          highestBid: formatEther(details.highestBid),
          highestBidder: details.highestBidder,
          endTime: new Date(details.endTime.toNumber() * 1000),
          active: details.active,
          image: 'https://via.placeholder.com/800x600'
        };
        setAuction(base);

        // Fetch bid history from events
        const bidFilter = contract.filters.BidPlaced(id, null, null);
        const bidEvents = await contract.queryFilter(bidFilter);
        const history = bidEvents.map(event => ({
          bidder: `${event.args.bidder.substring(0, 6)}...${event.args.bidder.substring(event.args.bidder.length - 4)}`,
          amount: `${formatEther(event.args.amount)} ETH`,
        })).reverse(); // Show newest bids first
        setBidHistory(history);

      } catch (error) {
        console.error('Error fetching auction details:', error);
        setAuction(mockAuctionDetails);
        setBidHistory(mockBidHistory);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionDetails();
  }, [id, provider]);

  const handlePlaceBid = async () => {
    if (!bidAmount || isNaN(bidAmount) || parseFloat(bidAmount) <= 0) {
      alert('Please enter a valid bid amount.');
      return;
    }
    if (!provider || !account) {
      alert('Please connect your wallet to place a bid.');
      return;
    }

    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.placeBid(id, parseEther(bidAmount));
      
      // Wait for MetaMask confirmation and transaction to be mined
      await tx.wait();
      
      alert('Bid placed successfully!');
      // Refresh auction details to show the new bid
      // (Or optimistically update the UI)
    } catch (error) {
      console.error('Error placing bid:', error);
      alert('Failed to place bid. See console for details.');
    }
  };

  if (loading) return <p className="text-center">Loading auction details...</p>;
  if (!auction) return <p className="text-center">Auction not found.</p>;

  const shortenAddress = (addr) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Image and Details */}
        <div>
          <img src={auction.image} alt={auction.title} className="w-full rounded-lg shadow-lg" />
          <h1 className="text-4xl font-bold mt-4">{auction.title}</h1>
          <p className="text-gray-400 mt-2">Sold by: {shortenAddress(auction.seller)}</p>
          <p className="mt-4 text-gray-300">{auction.description}</p>
        </div>

        {/* Right Side: Bidding and Info */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Auction Status</h2>
            <span className={`px-3 py-1 rounded-full text-white ${auction.active ? 'bg-green-500' : 'bg-red-500'}`}>
              {auction.active ? 'Active' : 'Ended'}
            </span>
          </div>

          {auction.active && (
            <div className="mb-6 text-center">
              <p className="text-gray-400">Time Remaining:</p>
              <div className="text-3xl font-bold text-yellow-400">
                <Countdown endTime={auction.endTime} />
              </div>
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-400">Current Highest Bid:</p>
            <p className="text-3xl font-bold">{auction.highestBid} ETH</p>
            <p className="text-gray-500">by: {shortenAddress(auction.highestBidder)}</p>
          </div>

          {auction.active ? (
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">Place Your Bid</h3>
              <div className="flex items-center">
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  className="w-full p-3 border rounded-l-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`> ${auction.highestBid} ETH`}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                />
                <button 
                  onClick={handlePlaceBid}
                  className="bg-blue-600 text-white py-3 px-6 rounded-r-lg hover:bg-blue-700 transition-colors"
                >
                  Place Bid
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center bg-gray-700 p-4 rounded-lg">
              <h3 className="text-xl font-bold">Auction Ended</h3>
              <p className="mt-2">Winner: {shortenAddress(auction.highestBidder)}</p>
              <p>Final Price: {auction.highestBid} ETH</p>
            </div>
          )}

          <div>
            <h3 className="text-xl font-bold mb-2">Bid History</h3>
            <ul className="space-y-2">
              {bidHistory.map((bid, index) => (
                <li key={index} className="flex justify-between bg-gray-700 p-2 rounded-lg">
                  <span>{bid.bidder}</span>
                  <span className="font-bold">{bid.amount}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetails;
