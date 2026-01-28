import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import Auth from './components/Auth/Auth';
import ExpenseForm from './components/ExpenseForm/ExpenseForm';
import Dashboard from './components/Dashboard/Dashboard';
import TransactionsPage from './components/Transactions/TransactionsPage';
import { supabase } from './services/supabaseClient';

function NavBar({ onLogout }) {
  return (
    <nav className="bg-black text-white px-8 py-4 shadow-md flex justify-between items-center">
      <div className="text-xl font-bold tracking-wide">ExpManager</div>
      <div className="flex space-x-8">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `text-lg font-medium transition ${
              isActive ? 'text-gray-300 border-b-2 border-gray-300 pb-1' : 'hover:text-gray-400'
            }`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            `text-lg font-medium transition ${
              isActive ? 'text-gray-300 border-b-2 border-gray-300 pb-1' : 'hover:text-gray-400'
            }`
          }
        >
          Transactions
        </NavLink>
        <NavLink
          to="/form"
          className={({ isActive }) =>
            `text-lg font-medium transition ${
              isActive ? 'text-gray-300 border-b-2 border-gray-300 pb-1' : 'hover:text-gray-400'
            }`
          }
        >
          Add Transaction
        </NavLink>
        <button
          onClick={onLogout}
          className="text-lg font-medium transition hover:text-gray-400"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [editTransaction, setEditTransaction] = useState(null);
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/'); // back to login
  }

  if (!user) {
    return <Auth setUser={setUser} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar onLogout={handleLogout} />

      {/* Page Content */}
      <div className="p-8">
        <Routes>
          {/* ✅ Default route → Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Transactions Page */}
          <Route
            path="/transactions"
            element={<TransactionsPage onEdit={setEditTransaction} />}
          />

          {/* Add Transaction */}
          <Route
            path="/form"
            element={
              <ExpenseForm
                editTransaction={editTransaction}
                clearEdit={() => setEditTransaction(null)}
              />
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default function RootApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}
