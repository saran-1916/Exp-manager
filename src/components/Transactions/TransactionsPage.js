import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

function TransactionsPage({ onEdit }) {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const navigate = useNavigate();

  // Filter states
  const [dateFilter, setDateFilter] = useState('');
  const [descFilter, setDescFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('');
  const [debitFilter, setDebitFilter] = useState('');
  const [creditFilter, setCreditFilter] = useState('');

  // ✅ Get logged-in user
  useEffect(() => {
    async function getUser() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Auth error:", error.message);
      } else {
        setUser(user);
      }
    }
    getUser();
  }, []);

  // ✅ Fetch transactions for logged-in user
  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          date,
          description,
          debit,
          credit,
          category_id,
          subcategory_id,
          categories ( name ),
          subcategories ( name )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error("Fetch error:", error.message);
        return;
      }

      setTransactions(data || []);
    }

    fetchData();
  }, [user]);

  async function handleDelete(id) {
    const confirmDelete = window.confirm("Are you sure you want to delete this transaction?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Delete error:", error.message);
      alert("Failed to delete: " + error.message);
    } else {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  }

  function handleEdit(t) {
    onEdit(t);
    navigate('/form');
  }

  // ✅ Apply filters
  const filteredTransactions = transactions.filter(t => {
    return (
      (!dateFilter || t.date.includes(dateFilter)) &&
      (!descFilter || t.description?.toLowerCase().includes(descFilter.toLowerCase())) &&
      (!categoryFilter || t.categories?.name?.toLowerCase().includes(categoryFilter.toLowerCase())) &&
      (!subCategoryFilter || t.subcategories?.name?.toLowerCase().includes(subCategoryFilter.toLowerCase())) &&
      (!debitFilter || String(t.debit).includes(debitFilter)) &&
      (!creditFilter || String(t.credit).includes(creditFilter))
    );
  });

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-black mb-6">All Transactions</h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2 px-3">Date</th>
            <th className="py-2 px-3">Description</th>
            <th className="py-2 px-3">Category</th>
            <th className="py-2 px-3">Subcategory</th>
            <th className="py-2 px-3">Debit</th>
            <th className="py-2 px-3">Credit</th>
            <th className="py-2 px-3">Actions</th>
          </tr>
          {/* Filter row */}
          <tr className="border-b bg-gray-50">
            <th className="py-1 px-3">
              <input
                type="text"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                placeholder="Filter"
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </th>
            <th className="py-1 px-3">
              <input
                type="text"
                value={descFilter}
                onChange={e => setDescFilter(e.target.value)}
                placeholder="Filter"
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </th>
            <th className="py-1 px-3">
              <input
                type="text"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                placeholder="Filter"
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </th>
            <th className="py-1 px-3">
              <input
                type="text"
                value={subCategoryFilter}
                onChange={e => setSubCategoryFilter(e.target.value)}
                placeholder="Filter"
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </th>
            <th className="py-1 px-3">
              <input
                type="text"
                value={debitFilter}
                onChange={e => setDebitFilter(e.target.value)}
                placeholder="Filter"
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </th>
            <th className="py-1 px-3">
              <input
                type="text"
                value={creditFilter}
                onChange={e => setCreditFilter(e.target.value)}
                placeholder="Filter"
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.map(t => (
            <tr key={t.id} className="border-b hover:bg-gray-50">
              <td className="py-2 px-3">{t.date}</td>
              <td className="py-2 px-3">{t.description}</td>
              <td className="py-2 px-3">{t.categories?.name || '—'}</td>
              <td className="py-2 px-3">{t.subcategories?.name || '—'}</td>
              <td className="py-2 px-3 text-red-600">₹{t.debit}</td>
              <td className="py-2 px-3 text-green-600">₹{t.credit}</td>
              <td className="py-2 px-3 space-x-3">
                <button
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => handleEdit(t)}
                >
                  Edit
                </button>
                <button
                  className="text-sm text-red-600 hover:underline"
                  onClick={() => handleDelete(t.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionsPage;