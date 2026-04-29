import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabaseClient';

// Components
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import TransactionsPage from './components/transactions/TransactionsPage';
import ExpenseForm from './components/expenseform/ExpenseForm';
import Auth from './components/auth/Auth';
import MoneyTracker from './components/money-tracker/MoneyTracker';
import StatisticsPage from './components/statistics/StatisticsPage';
import Profile from './components/profile/Profile';

export default function App() {
  const [user, setUser] = useState(undefined);
  const [collapsed, setCollapsed] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (user === undefined) return null;
  if (!user) return <Auth setUser={setUser} />;

  return (
    <Router>
      <div className="flex min-h-screen max-w-[100vw] overflow-x-hidden bg-white font-sans">
        <Sidebar user={user} onLogout={() => supabase.auth.signOut()} collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className={`w-full max-w-[100vw] flex-1 overflow-x-hidden p-4 pb-28 transition-all duration-300 md:p-10 ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/transactions" element={<TransactionsPage user={user} onEdit={setEditTransaction} />} />
            <Route path="/form" element={<ExpenseForm editTransaction={editTransaction} clearEdit={() => setEditTransaction(null)} />} />
            <Route path="/money-tracker" element={<MoneyTracker user={user} />} />
            <Route path="/statistics" element={<StatisticsPage user={user} />} />
            
            {/* ✅ 2. ADD THIS ROUTE HERE */}
            <Route path="/profile" element={<Profile user={user} />} />
            
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
