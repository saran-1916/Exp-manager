import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Auth from './components/Auth/Auth';
import ExpenseForm from './components/ExpenseForm/ExpenseForm';
import Dashboard from './components/Dashboard/Dashboard';
import TransactionsPage from './components/Transactions/TransactionsPage';
import Sidebar from './components/Sidebar/Sidebar';
import { supabase } from './services/supabaseClient';

function AppContent() {
  const [user, setUser] = useState(null);
  const [editTransaction, setEditTransaction] = useState(null);
  const [collapsed, setCollapsed] = useState(false); // ✅ sidebar toggle
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  }

  if (!user) {
    return <Auth setUser={setUser} />;
  }

  return (
    <div className="flex">
      {/* ✅ Sidebar */}
      <Sidebar
        user={user}
        onLogout={handleLogout}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* ✅ Main content shifts based on sidebar width */}
      <div
        className={`${collapsed ? 'ml-20' : 'ml-64'} w-full p-8 bg-gray-100 min-h-screen transition-all duration-300`}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/form"
            element={
              <ExpenseForm
                editTransaction={editTransaction}
                clearEdit={() => setEditTransaction(null)}
              />
            }
          />
          <Route
            path="/transactions"
            element={<TransactionsPage onEdit={setEditTransaction} />}
          />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
