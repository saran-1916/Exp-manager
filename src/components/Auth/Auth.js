import { useState } from 'react';
import { useNavigate } from 'react-router-dom';   // ✅ add this
import { supabase } from '../../services/supabaseClient';

function Auth({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();   // ✅ initialize navigate

  async function handleLogin(e) {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    } else {
      setUser(data.user);
      navigate('/dashboard');   // ✅ redirect immediately after login
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(error.message);
    } else {
      setUser(data.user);
      navigate('/dashboard');   // ✅ redirect immediately after signup
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/login');   // ✅ go back to login page after logout
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-center text-black mb-6">
          Expense Manager
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Sign in to continue
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-md font-semibold hover:bg-gray-800 transition"
          >
            Sign In
          </button>
        </form>

        <form onSubmit={handleSignup} className="mt-6">
          <button
            type="submit"
            className="w-full bg-gray-200 text-black py-3 rounded-md font-semibold hover:bg-gray-300 transition"
          >
            Create Account
          </button>
        </form>

        <button
          onClick={handleLogout}
          className="mt-6 w-full text-sm text-gray-500 hover:underline"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Auth;
