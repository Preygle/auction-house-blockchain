import React from 'react';
import { Link } from 'react-router-dom';
import Countdown from './Countdown';

const AuctionCard = ({ auction }) => {
  const ipfsGateway = 'https://ipfs.io/ipfs/';
  const placeholderImage = 'https://via.placeholder.com/300';

  return (
    <div className="border rounded-lg p-4 shadow-lg bg-white text-gray-900">
      <img 
        src={auction.image ? `${ipfsGateway}${auction.image}` : placeholderImage} 
        alt={auction.title} 
        className="w-full h-48 object-cover rounded-t-lg"
      />
      <div className="p-4">
        <h2 className="text-xl font-bold mb-2">{auction.title}</h2>
        <p className="text-gray-600">Current Bid: {auction.highestBid} ETH</p>
        <div className="my-2">
          <Countdown endTime={auction.endTime} />
        </div>
        <Link to={`/auction/${auction.id}`} className="block w-full text-center bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors">
          View Auction
        </Link>
      </div>
    </div>
  );
};

export default AuctionCard;
