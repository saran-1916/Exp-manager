import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  PlusCircleIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const navItems = [
  { name: 'Dashboard', path: '/', icon: HomeIcon },
  { name: 'Add Expense', path: '/add', icon: PlusCircleIcon },
  { name: 'Reports', path: '/reports', icon: ClipboardDocumentListIcon },
  { name: 'Profile', path: '/profile', icon: UserCircleIcon }
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="h-screen w-56 bg-black text-white flex flex-col shadow-lg">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold tracking-wide">Expense Manager</h1>
      </div>

      <nav className="flex-1 p-4 space-y-3">
        {navItems.map(({ name, path, icon: Icon }) => (
          <Link
            key={name}
            to={path}
            className={`flex items-center space-x-3 px-2 py-2 rounded-md transition-colors ${
              location.pathname === path
                ? 'bg-gray-800 text-yellow-400'
                : 'hover:text-yellow-400'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-sm font-medium">{name}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button className="flex items-center space-x-3 px-2 py-2 hover:text-red-400 transition-colors">
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
