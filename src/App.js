import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Auth from './components/Auth/Auth';
import ExpenseForm from './components/ExpenseForm/ExpenseForm';
import Dashboard from './components/Dashboard/Dashboard';
import TransactionsPage from './components/Transactions/TransactionsPage'; // ✅ Import new page

function App() {
  const [user, setUser] = useState(null);
  const [editTransaction, setEditTransaction] = useState(null);

  if (!user) {
    return <Auth setUser={setUser} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation Bar */}
        <nav className="bg-black text-white px-8 py-4 shadow-md flex justify-between items-center">
          <div className="text-xl font-bold tracking-wide">ExpManager</div>
          <div className="flex space-x-8">
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
              to="/dashboard"
              className={({ isActive }) =>
                `text-lg font-medium transition ${
                  isActive ? 'text-gray-300 border-b-2 border-gray-300 pb-1' : 'hover:text-gray-400'
                }`
              }
            >
              Dashboard
            </NavLink>
          </div>
        </nav>

        {/* Page Content */}
        <div className="p-8">
          <Routes>
            {/* Default route → redirect to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" />} />

            {/* Add Transaction */}
            <Route
              path="/form"
              element={
                <ExpenseForm
                  userId={user.id}
                  editTransaction={editTransaction}
                  clearEdit={() => setEditTransaction(null)}
                />
              }
            />

            {/* Transactions Page */}
            <Route
              path="/transactions"
              element={
                <TransactionsPage
                  userId={user.id}
                  onEdit={setEditTransaction}
                />
              }
            />

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={<Dashboard userId={user.id} />}
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;