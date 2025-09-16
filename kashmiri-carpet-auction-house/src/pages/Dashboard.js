import React, { useState, useEffect, useMemo } from 'react';
import { ethers, formatEther } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { CONTRACT_ADDRESS as contractAddress, CONTRACT_ABI as contractABI } from '../config/contract';
import { fetchIpfsJson } from '../utils/ipfs';

// Contract details are imported from config

// --- Mock Data (used if no provider or contractAddress not set) ---
const mockSellerAuctions = [
  { id: 1, title: 'Kashmiri Silk Carpet', status: 'Active', highestBid: '1.5', winner: null },
  { id: 4, title: 'Hand-Knotted Rug', status: 'Ended', highestBid: '2.1', winner: '0xABC...DEF' }
];

const mockBuyerAuctions = [
  { id: 2, title: 'Antique Persian Rug', myBid: '2.3', outcome: 'Highest Bidder', won: true },
  { id: 3, title: 'Modern Geometric Carpet', myBid: '0.7', outcome: 'Outbid', won: false }
];

const Dashboard = () => {
  const { provider, account } = useWallet();
  const { role } = useWallet();
  const [view, setView] = useState('seller');
  const [sellerAuctions, setSellerAuctions] = useState([]);
  const [buyerAuctions, setBuyerAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const canQuery = useMemo(() => !!provider && !!account && contractAddress !== 'YOUR_CONTRACT_ADDRESS', [provider, account]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!canQuery) {
        setSellerAuctions(mockSellerAuctions);
        setBuyerAuctions(mockBuyerAuctions);
        setLoading(false);
        return;
      }

      try {
        const contract = new ethers.Contract(contractAddress, contractABI, provider);

        // Pull all relevant events
        const [createdForSeller, allEnded, myBids] = await Promise.all([
          contract.queryFilter(contract.filters.AuctionCreated(null, account, null)),
          contract.queryFilter(contract.filters.AuctionEnded(null, null, null)),
          contract.queryFilter(contract.filters.BidPlaced(null, account, null))
        ]);

        // Index AuctionEnded by auctionId
        const auctionIdToEnd = new Map();
        for (const evt of allEnded) {
          const auctionId = evt.args.auctionId.toString();
          auctionIdToEnd.set(auctionId, {
            winner: evt.args.winner,
            amount: formatEther(evt.args.amount)
          });
        }

        // For each created auction by seller, compute status and highest bid from events
        const sellerItems = [];
        for (const evt of createdForSeller) {
          const auctionId = evt.args.auctionId.toString();
          let title = `Auction #${auctionId}`;
          const metadataUri = evt.args.metadataURI;
          if (metadataUri && metadataUri.length) {
            try {
              const json = await fetchIpfsJson(metadataUri);
              if (json && json.name) title = json.name;
            } catch (_) {}
          }
          const endInfo = auctionIdToEnd.get(auctionId);

          // Get highest bid via BidPlaced events for this auction
          const bidsForAuction = await contract.queryFilter(contract.filters.BidPlaced(auctionId, null, null));
          let highest = '0';
          if (bidsForAuction.length > 0) {
            highest = bidsForAuction
              .reduce((max, e) => {
                const amt = e.args.amount;
                return amt > max ? amt : max;
              }, bidsForAuction[0].args.amount);
          }

          sellerItems.push({
            id: Number(auctionId),
            title,
            status: endInfo ? 'Ended' : 'Active',
            highestBid: bidsForAuction.length ? formatEther(highest) : '0',
            winner: endInfo ? `${endInfo.winner.substring(0, 6)}...${endInfo.winner.substring(endInfo.winner.length - 4)}` : null
          });
        }
        setSellerAuctions(sellerItems);

        // Buyer view: dedupe auctionIds the user bid on
        const seen = new Set();
        const buyerItems = [];
        for (const evt of myBids) {
          const auctionId = evt.args.auctionId.toString();
          if (seen.has(auctionId)) continue;
          seen.add(auctionId);

          // Pull full bid history for this auction to compute my highest bid
          const bidsForAuction = await contract.queryFilter(contract.filters.BidPlaced(auctionId, null, null));
          const myBidEvents = bidsForAuction.filter(e => e.args.bidder.toLowerCase() === account.toLowerCase());
          const myHighest = myBidEvents.length
            ? myBidEvents.reduce((max, e) => (e.args.amount > max ? e.args.amount : max), myBidEvents[0].args.amount)
            : null;

          const endInfo = auctionIdToEnd.get(auctionId);
          const iWon = endInfo && endInfo.winner.toLowerCase() === account.toLowerCase();

          buyerItems.push({
            id: Number(auctionId),
            title: `Auction #${auctionId}`,
            myBid: myHighest ? formatEther(myHighest) : '0',
            outcome: endInfo ? (iWon ? 'Won' : 'Lost') : 'Ongoing',
            won: !!iWon
          });
        }
        setBuyerAuctions(buyerItems);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setSellerAuctions(mockSellerAuctions);
        setBuyerAuctions(mockBuyerAuctions);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [provider, account, canQuery]);

  const handleClaimFunds = async (auctionId) => {
    if (!provider || !account || contractAddress === 'YOUR_CONTRACT_ADDRESS') {
      alert('Connect wallet and configure contract to claim funds.');
      return;
    }
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.claimFunds(auctionId);
      await tx.wait();
      alert('Funds claimed successfully.');
    } catch (err) {
      console.error('Claim funds failed', err);
      alert('Failed to claim funds. See console for details.');
    }
  };

  const handleClaimNFT = async (auctionId) => {
    if (!provider || !account || contractAddress === 'YOUR_CONTRACT_ADDRESS') {
      alert('Connect wallet and configure contract to claim NFT.');
      return;
    }
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.claimNFT(auctionId);
      await tx.wait();
      alert('NFT claimed successfully.');
    } catch (err) {
      console.error('Claim NFT failed', err);
      alert('Failed to claim NFT. See console for details.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-center mb-6 border-b border-gray-700">
        <button
          onClick={() => setView('seller')}
          className={`px-6 py-3 text-lg font-medium ${view === 'seller' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'}`}
        >
          Seller Dashboard
        </button>
        <button
          onClick={() => setView('buyer')}
          className={`px-6 py-3 text-lg font-medium ${view === 'buyer' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'}`}
        >
          Buyer Dashboard
        </button>
      </div>

      {loading ? (
        <p className="text-center">Loading dashboard...</p>
      ) : (
        role === 'seller' ? (
          <SellerDashboard auctions={sellerAuctions} onClaimFunds={handleClaimFunds} />
        ) : (
          <BuyerDashboard auctions={buyerAuctions} onClaimNFT={handleClaimNFT} />
        )
      )}
    </div>
  );
};

const SellerDashboard = ({ auctions, onClaimFunds }) => (
  <div>
    <h2 className="text-2xl font-bold mb-4 text-white">Your Published Auctions</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {auctions.map((auction) => (
        <div key={auction.id} className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold">{auction.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs ${auction.status === 'Active' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
              {auction.status}
            </span>
          </div>
          <p className="text-gray-300">Highest Bid: <span className="font-semibold">{auction.highestBid} ETH</span></p>
          {auction.status === 'Ended' && auction.winner && (
            <p className="text-gray-400 mt-1">Winner: {auction.winner}</p>
          )}
          {auction.status === 'Ended' && (
            <button
              onClick={() => onClaimFunds(auction.id)}
              className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
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
      {auctions.map((auction) => (
        <div key={auction.id} className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700">
          <h3 className="text-xl font-bold mb-2">{auction.title}</h3>
          <p className="text-gray-300">Your Highest Bid: <span className="font-semibold">{auction.myBid} ETH</span></p>
          <p className="text-gray-400">Outcome: {auction.outcome}</p>
          {auction.won && (
            <button
              onClick={() => onClaimNFT(auction.id)}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Claim NFT
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default Dashboard;
