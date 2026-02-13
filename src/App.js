import { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate
} from 'react-router-dom';
import Auth from './components/Auth/Auth';
import ExpenseForm from './components/ExpenseForm/ExpenseForm';
import Dashboard from './components/Dashboard/Dashboard';
import TransactionsPage from './components/Transactions/TransactionsPage';
import Profile from './components/Profile/Profile';
import Sidebar from './components/Sidebar/Sidebar';
import MoneyTracker from './components/MoneyTracker/MoneyTracker';
import { supabase } from './services/supabaseClient';

function AppContent() {
  const [user, setUser] = useState(undefined); // undefined until session checked
  const [editTransaction, setEditTransaction] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  // ✅ Load session before rendering
  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user ?? null);
    }
    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    setUser(null); // clear immediately for snappy UI
    await supabase.auth.signOut();
    navigate('/login');
  }

  // ✅ Show loading until session is resolved
  if (user === undefined) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // ✅ Show login if no user
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Auth setUser={setUser} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // ✅ Authenticated layout
  return (
    <div className="flex">
      <Sidebar
        user={user}
        onLogout={handleLogout}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      {/* Match margin with sidebar width exactly */}
      <div
        className={`${collapsed ? 'ml-20' : 'ml-56'} w-full p-6 bg-gray-100 min-h-screen transition-all duration-300`}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard user={user} />} />
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
          <Route path="/money-tracker" element={<MoneyTracker user={user} />} />
          <Route path="/profile" element={<Profile user={user} />} />
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
