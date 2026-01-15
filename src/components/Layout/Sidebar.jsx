import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  UtensilsCrossed,
  Grid3x3,
  ClipboardList,
  ChefHat,
  BarChart3,
  Package, 
  Users,
  Settings,
  Wallet
} from 'lucide-react';
import { MENU_ITEMS, RESTAURANT_NAME } from '../../data/menuData';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { hasAccess } = useAuth();
  
  // Map icon names to icon components
  const iconMap = {
    LayoutDashboard,
    FileText,
    UtensilsCrossed,
    Grid3x3,
    ClipboardList,
    ChefHat,
    BarChart3,
    Package,
    Users,
    Settings,
    Wallet
  };

  // Filter menu items based on user access
  const accessibleMenuItems = MENU_ITEMS.filter(item => hasAccess(item.value));

  return (
    <div className="w-64 bg-white h-screen fixed left-0 top-0 flex flex-col border-r border-gray-200">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-[#ec2b25]">{RESTAURANT_NAME}</h1>
          <p className="text-sm text-gray-500 mt-1">Management System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {accessibleMenuItems.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 transition-colors ${
                  isActive
                    ? 'bg-[#ec2b25] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={20} strokeWidth={2} />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">v1.0.0</p>
      </div>
    </div>
  );
};

export default Sidebar;
