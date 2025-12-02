import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  UtensilsCrossed,
  Grid3x3,
  ClipboardList,
  Package, 
  DollarSign,
  Users
} from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/billing', icon: FileText, label: 'Billing' },
    { path: '/menu', icon: UtensilsCrossed, label: 'Menu' },
    { path: '/tables', icon: Grid3x3, label: 'Tables' },
    { path: '/orders', icon: ClipboardList, label: 'Orders' },
    { path: '/investment', icon: Package, label: 'Investment' },
    { path: '/payroll', icon: DollarSign, label: 'Payroll' },
    { path: '/staff', icon: Users, label: 'Staff' },
  ];

  return (
    <div className="w-64 bg-white h-screen fixed left-0 top-0 flex flex-col border-r border-gray-200">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurant</h1>
          <p className="text-sm text-gray-500 mt-1">Management System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
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
            <item.icon size={20} strokeWidth={2} />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">v1.0.0</p>
      </div>
    </div>
  );
};

export default Sidebar;
