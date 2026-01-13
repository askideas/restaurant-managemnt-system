import React from 'react';
import { RestaurantProvider } from './context/RestaurantContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import BillingPage from './pages/BillingPage';
import MenuPage from './pages/MenuPage';
import TablesPage from './pages/TablesPage';
import Orders from './pages/Orders';
import Investment from './pages/Investment';
import Staff from './pages/Staff';

const App = () => {
  return (
    <RestaurantProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 1500,
            style: {
              background: '#fff',
              color: '#333',
            },
            success: {
              iconTheme: {
                primary: '#ec2b25',
                secondary: '#fff',
              },
            },
          }}
        />
        <div className="flex h-screen bg-gray-50">
          {/* Sidebar */}
          <Sidebar />
          {/* Main Content */}
          <div className="flex-1 ml-64 flex flex-col">
            {/* Header */}
            <Header />
            {/* Page Content */}
            <main className="flex-1 overflow-y-auto p-6">
              <Routes>
                <Route path="/" element={<div>Dashboard Page - Coming Soon</div>} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/tables" element={<TablesPage />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/investments" element={<Investment />} />
                <Route path="/payroll" element={<div>Payroll Page - Coming Soon</div>} />
                <Route path="/staff" element={<Staff />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </RestaurantProvider>
  );
};

export default App;