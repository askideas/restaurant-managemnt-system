import React from 'react';
import { Bell, User, Search } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex items-center flex-1 max-w-md">
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
          <button className="p-2 hover:bg-gray-100 transition-colors cursor-pointer">
            <Bell className="w-5 h-5 text-gray-700" />
          </button>
          <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 transition-colors cursor-pointer">
            <User className="w-5 h-5 text-gray-700" />
            <span className="text-sm font-medium text-gray-700">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
