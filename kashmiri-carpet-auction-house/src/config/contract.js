// Centralized contract configuration
// Replace the address and ABI below or load them from environment variables.

export const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || 'YOUR_CONTRACT_ADDRESS';

// Provide the full ABI for production. Minimal fragments are kept for now.
export const CONTRACT_ABI = [
  'function getAllAuctions() view returns (tuple(uint256 id, string title, uint256 highestBid, uint256 endTime, string image)[])',
  'function getAuctionById(uint256 auctionId) view returns (tuple(uint256 id, string title, string description, address seller, uint256 highestBid, address highestBidder, uint256 endTime, bool active))',
  'function placeBid(uint256 auctionId, uint256 bidAmount)',
  'function claimFunds(uint256 auctionId)',
  'function claimNFT(uint256 auctionId)',
  'event AuctionCreated(uint256 indexed auctionId, address indexed seller, string metadataURI)',
  'event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount)',
  'event AuctionEnded(uint256 indexed auctionId, address winner, uint256 amount)'
];


