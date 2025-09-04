import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useWallet } from './contexts/WalletContext';
import ExploreAuctions from './pages/ExploreAuctions';
import AuctionDetails from './pages/AuctionDetails';
import PublishCarpet from './pages/PublishCarpet';
import Dashboard from './pages/Dashboard';

const AppContent = () => {
  const { account, shortenedAddress, connectWallet } = useWallet();

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold"><Link to="/">Kashmiri Carpet Auction House</Link></div>
        <nav className="space-x-6">
          <Link to="/" className="hover:text-gray-400">Home</Link>
          <Link to="/publish" className="hover:text-gray-400">Publish Carpet</Link>
          <Link to="/dashboard" className="hover:text-gray-400">Dashboard</Link>
        </nav>
        <button 
          onClick={connectWallet} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
        >
          {account ? shortenedAddress : 'Connect Wallet'}
        </button>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<ExploreAuctions />} />
          <Route path="/auction/:id" element={<AuctionDetails />} />
          <Route path="/publish" element={<PublishCarpet />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 py-8 mt-8">
        <div className="container mx-auto px-6 text-center text-gray-400">
          <p>&copy; 2025 Kashmiri Carpet Auction House. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
