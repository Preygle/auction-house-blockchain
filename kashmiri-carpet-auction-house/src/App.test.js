import { render, screen } from '@testing-library/react';

// Provide a virtual mock for react-router-dom to avoid ESM resolution issues in CRA Jest
jest.mock('react-router-dom', () => ({
  __esModule: true,
  BrowserRouter: ({ children }) => <div>{children}</div>,
  MemoryRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ element }) => <div>{element}</div>,
  Link: ({ children }) => <a>{children}</a>,
  useNavigate: () => jest.fn(),
  Navigate: ({ to }) => <div>Navigate to {to}</div>
}), { virtual: true });

// Minimal mock for WalletContext used by App
jest.mock('./contexts/WalletContext', () => ({
  __esModule: true,
  useWallet: () => ({ account: null, role: null })
}));

import App from './App';

test('renders app shell', () => {
  render(<App />);
  expect(screen.getByText(/Kashmiri Carpet Auction House/i)).toBeInTheDocument();
});
