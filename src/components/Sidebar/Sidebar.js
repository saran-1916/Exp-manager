import React from 'react';
import {
  HomeIcon,
  PlusCircleIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  return (
    <div className="h-screen w-64 bg-white shadow-md flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-gray-800">Expense Manager</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <a href="/" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
          <HomeIcon className="h-6 w-6" />
          <span>Dashboard</span>
        </a>
        <a href="/add" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
          <PlusCircleIcon className="h-6 w-6" />
          <span>Add Expense</span>
        </a>
        <a href="/reports" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
          <ClipboardDocumentListIcon className="h-6 w-6" />
          <span>Reports</span>
        </a>
        <a href="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
          <UserCircleIcon className="h-6 w-6" />
          <span>Profile</span>
        </a>
      </nav>
      <div className="p-4 border-t">
        <button className="flex items-center space-x-2 text-gray-700 hover:text-red-600">
          <ArrowRightOnRectangleIcon className="h-6 w-6" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
