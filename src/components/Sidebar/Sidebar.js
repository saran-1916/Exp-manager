import { NavLink } from 'react-router-dom';
import { HomeIcon, PlusCircleIcon, ClipboardListIcon, ArrowLeftOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';

function Sidebar({ user, onLogout, collapsed, setCollapsed }) {
  return (
    <div
      className={`h-screen ${collapsed ? 'w-16' : 'w-56'} bg-gray-900 text-white flex flex-col justify-between shadow-lg fixed transition-all duration-300`}
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-2 text-gray-400 hover:text-white"
      >
        {collapsed ? '➡️' : '⬅️'}
      </button>

      {/* Navigation links */}
      <div className="flex-1 p-4 space-y-4">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 ${
              isActive ? 'bg-gray-800' : ''
            }`
          }
        >
          <HomeIcon className="h-5 w-5" />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        <NavLink
          to="/form"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 ${
              isActive ? 'bg-gray-800' : ''
            }`
          }
        >
          <PlusCircleIcon className="h-5 w-5" />
          {!collapsed && <span>Add Transaction</span>}
        </NavLink>

        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 ${
              isActive ? 'bg-gray-800' : ''
            }`
          }
        >
          <ClipboardListIcon className="h-5 w-5" />
          {!collapsed && <span>Transactions</span>}
        </NavLink>
      </div>

      {/* User info + logout */}
      <div className="p-4 border-t border-gray-700 text-sm text-gray-300">
        {!collapsed && (
          <div className="flex items-center gap-2 mb-2">
            <UserCircleIcon className="h-5 w-5" />
            <span>{user?.email}</span>
          </div>
        )}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 font-semibold"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
