import { NavLink } from 'react-router-dom';

function Sidebar({ user, onLogout, collapsed, setCollapsed }) {
  return (
    <div
      className={`h-screen ${collapsed ? 'w-20' : 'w-64'} bg-gray-900 text-white flex flex-col justify-between shadow-lg fixed transition-all duration-300`}
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-2 text-gray-300 hover:text-white"
      >
        {collapsed ? '➡️' : '⬅️'}
      </button>

      {/* Navigation links */}
      <div className="p-6 space-y-6">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `block px-4 py-2 rounded hover:bg-gray-700 ${
              isActive ? 'bg-gray-800' : ''
            }`
          }
        >
          🏠 {!collapsed && 'Dashboard'}
        </NavLink>
        <NavLink
          to="/form"
          className={({ isActive }) =>
            `block px-4 py-2 rounded hover:bg-gray-700 ${
              isActive ? 'bg-gray-800' : ''
            }`
          }
        >
          ➕ {!collapsed && 'Add Transaction'}
        </NavLink>
        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            `block px-4 py-2 rounded hover:bg-gray-700 ${
              isActive ? 'bg-gray-800' : ''
            }`
          }
        >
          📋 {!collapsed && 'Transactions'}
        </NavLink>
      </div>

      {/* User info + logout */}
      <div className="p-6 border-t border-gray-700 text-sm text-gray-300">
        {!collapsed && (
          <div className="mb-2">
            👤 Logged in as: <span className="font-medium">{user?.email}</span>
          </div>
        )}
        <button
          onClick={onLogout}
          className="text-red-400 hover:text-red-300 font-semibold"
        >
          🚪 {!collapsed && 'Logout'}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
