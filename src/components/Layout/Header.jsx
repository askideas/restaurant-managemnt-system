import React from 'react';
import { Bell, User, Search, Phone, LogOut } from 'lucide-react';
import { RESTAURANT_NAME, SUPPORT_PHONE } from '../../data/menuData';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { staffData, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Restaurant Name */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-[#ec2b25]">{RESTAURANT_NAME}</h1>
        </div>

        {/* Search Bar */}
        <div className="flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 focus:outline-none focus:border-primary text-sm"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          <a 
            href={`tel:${SUPPORT_PHONE}`}
            className="flex items-center space-x-2 px-3 py-2 bg-[#ec2b25] text-white hover:bg-[#d12620] transition-colors cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span className="text-sm font-medium">Support</span>
            <span className="text-sm">{SUPPORT_PHONE}</span>
          </a>
          <button className="p-2 hover:bg-gray-100 transition-colors cursor-pointer">
            <Bell className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-700" />
              <span className="text-sm font-medium text-gray-700">
                {staffData?.name || 'User'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
