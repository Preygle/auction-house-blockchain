import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { useWallet } from './contexts/WalletContext';
import ExploreAuctions from './pages/ExploreAuctions';
import AuctionDetails from './pages/AuctionDetails';
import PublishCarpet from './pages/PublishCarpet';
import Dashboard from './pages/Dashboard';
import ConnectWalletButton from './components/ConnectWalletButton';
import Login from './pages/Login';

const ProtectedRoute = ({ children }) => {
  const { account, role } = useWallet();
  if (!account || !role) return <Navigate to="/login" replace />;
  return children;
};

const AppContent = () => {
  const { role } = useWallet();
  const navigate = useNavigate();

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold"><Link to="/login">Kashmiri Carpet Auction House</Link></div>
        <nav className="space-x-6">
          <Link to="/explore" className="hover:text-gray-400">Explore</Link>
          <Link to="/publish" className="hover:text-gray-400">List a Carpet</Link>
          <Link to="/dashboard" className="hover:text-gray-400">Dashboard</Link>
        </nav>
        <ConnectWalletButton onConnected={(r) => {
          if (r === 'buyer') navigate('/explore');
          if (r === 'seller') navigate('/publish');
        }} />
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/explore" element={
            <ProtectedRoute>
              <ExploreAuctions />
            </ProtectedRoute>
          } />
          <Route path="/auction/:id" element={
            <ProtectedRoute>
              <AuctionDetails />
            </ProtectedRoute>
          } />
          <Route path="/publish" element={
            <ProtectedRoute>
              <PublishCarpet />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
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
