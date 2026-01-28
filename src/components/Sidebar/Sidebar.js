import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  PlusCircleIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ user, onLogout, collapsed, setCollapsed }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { name: 'Add Expense', path: '/form', icon: PlusCircleIcon },
    { name: 'Transactions', path: '/transactions', icon: ClipboardDocumentListIcon },
    { name: 'Profile', path: '/profile', icon: UserCircleIcon }
  ];

  return (
    <div
      className={`fixed top-0 left-0 h-screen ${collapsed ? 'w-20' : 'w-56'} 
      bg-gradient-to-b from-black to-gray-900 text-white flex flex-col shadow-xl transition-all duration-300`}
    >
      {/* Header with collapse toggle */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        {!collapsed && (
          <h1 className="text-xl font-bold tracking-wide">Expense Manager</h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-yellow-400 transition-colors"
        >
          {collapsed ? '➡️' : '⬅️'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-3">
        {navItems.map(({ name, path, icon: Icon }) => (
          <Link
            key={name}
            to={path}
            className={`group flex items-center space-x-3 px-2 py-2 rounded-md transition-colors ${
              location.pathname === path
                ? 'bg-gray-800 text-yellow-400'
                : 'hover:text-yellow-400'
            }`}
          >
            <Icon className="h-5 w-5" />
            {!collapsed && <span className="text-sm font-medium">{name}</span>}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={onLogout}
          className="group flex items-center space-x-3 px-2 py-2 hover:text-red-400 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
