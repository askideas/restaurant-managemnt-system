import React from 'react';
import { RestaurantProvider } from './context/RestaurantContext';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import BillingPage from './pages/BillingPage';
import MenuPage from './pages/MenuPage';
import TablesPage from './pages/TablesPage';
import Orders from './pages/Orders';
import Investment from './pages/Investment';
import Staff from './pages/Staff';

const App = () => {
  return (
    <AuthProvider>
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
          <Routes>
            {/* Public Route - Login */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
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
                          <Route 
                            path="/" 
                            element={
                              <ProtectedRoute menuValue="dashboard">
                                <div>Dashboard Page - Coming Soon</div>
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/billing" 
                            element={
                              <ProtectedRoute menuValue="billing">
                                <BillingPage />
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/menu" 
                            element={
                              <ProtectedRoute menuValue="menu">
                                <MenuPage />
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/tables" 
                            element={
                              <ProtectedRoute menuValue="tables">
                                <TablesPage />
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/orders" 
                            element={
                              <ProtectedRoute menuValue="orders">
                                <Orders />
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/investment" 
                            element={
                              <ProtectedRoute menuValue="investment">
                                <Investment />
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/staff" 
                            element={
                              <ProtectedRoute menuValue="staff">
                                <Staff />
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/settings" 
                            element={
                              <ProtectedRoute menuValue="settings">
                                <div>Settings Page - Coming Soon</div>
                              </ProtectedRoute>
                            } 
                          />
                        </Routes>
                      </main>
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </RestaurantProvider>
    </AuthProvider>
  );
};

export default App;