import { NavLink } from 'react-router-dom';

function Sidebar({ user, onLogout }) {
  return (
    <div className="h-screen w-64 bg-gray-900 text-white flex flex-col justify-between shadow-lg fixed">
      <div className="p-6 space-y-6">
        <NavLink to="/dashboard" className={({ isActive }) =>
          `block text-lg font-semibold px-4 py-2 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-800' : ''}`}>
          🏠 Dashboard
        </NavLink>
        <NavLink to="/form" className={({ isActive }) =>
          `block text-lg font-semibold px-4 py-2 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-800' : ''}`}>
          ➕ Add Transaction
        </NavLink>
        <NavLink to="/transactions" className={({ isActive }) =>
          `block text-lg font-semibold px-4 py-2 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-800' : ''}`}>
          📋 Transactions
        </NavLink>
      </div>
      <div className="p-6 border-t border-gray-700 space-y-3 text-sm text-gray-300">
        <div>👤 Logged in as: <span className="font-medium">{user?.email}</span></div>
        <button onClick={onLogout} className="text-left text-red-400 hover:text-red-300 font-semibold">
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;