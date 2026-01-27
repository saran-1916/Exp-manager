import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';

function Dashboard({ userId }) {
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]); // Store all transactions
  const [summary, setSummary] = useState({ debit: 0, credit: 0, balance: 0 });
  const [yearFilter, setYearFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [viewMode, setViewMode] = useState('debit'); // 'debit' or 'credit'
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => setCategories(data || []));
    supabase.from('subcategories').select('*').then(({ data }) => setSubcategories(data || []));
  }, []);

  useEffect(() => {
    async function fetchData() {
      let query = supabase
        .from('transactions')
        .select(`
          id, date, debit, credit, category_id, subcategory_id,
          categories ( name, type ), subcategories ( name )
        `)
        .eq('user_id', userId);

      if (yearFilter) query = query.like('date', `${yearFilter}-%`);
      if (monthFilter) query = query.like('date', `%-${monthFilter}-%`);
      if (categoryFilter) query = query.eq('category_id', categoryFilter);
      if (subcategoryFilter) query = query.eq('subcategory_id', subcategoryFilter);

      const { data, error } = await query;
      if (error) return console.error("Fetch error:", error.message);

      // Store all fetched transactions
      setAllTransactions(data || []);

      // Filter for display based on viewMode
      const filtered = data.filter(t => {
        const type = t.categories?.type;
        return viewMode === 'debit' ? type === 'Expense' : type === 'Income';
      });

      setTransactions(filtered);

      // Calculate summary from ALL transactions (not filtered by viewMode)
      const totalDebit = data.reduce((acc, t) => acc + Number(t.debit || 0), 0);
      const totalCredit = data.reduce((acc, t) => acc + Number(t.credit || 0), 0);
      setSummary({ 
        debit: totalDebit, 
        credit: totalCredit, 
        balance: totalCredit - totalDebit 
      });
    }

    fetchData();
  }, [userId, yearFilter, monthFilter, categoryFilter, subcategoryFilter, viewMode]);

  // Group by month and category/subcategory
  const monthlyCategoryTotals = {};
  const subcategoryMonthTotals = {};

  transactions.forEach(t => {
    const month = t.date?.slice(0, 7); // YYYY-MM
    const cat = t.categories?.name || 'Uncategorized';
    const sub = t.subcategories?.name || 'Uncategorized';
    const amount = viewMode === 'debit' ? Number(t.debit || 0) : Number(t.credit || 0);

    if (!monthlyCategoryTotals[month]) monthlyCategoryTotals[month] = {};
    monthlyCategoryTotals[month][cat] = (monthlyCategoryTotals[month][cat] || 0) + amount;

    if (!subcategoryMonthTotals[sub]) subcategoryMonthTotals[sub] = {};
    subcategoryMonthTotals[sub][month] = (subcategoryMonthTotals[sub][month] || 0) + amount;
  });

  function getTopSpender(data) {
    let max = 0;
    let top = '';
    for (const key in data) {
      if (data[key] > max) {
        max = data[key];
        top = key;
      }
    }
    return top;
  }

  return (
    <div className="max-w-7xl mx-auto mt-10 p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">Total Debit</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">₹{summary.debit.toFixed(2)}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">Total Credit</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">₹{summary.credit.toFixed(2)}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">Balance</h3>
          <p className={`text-2xl font-bold mt-2 ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{summary.balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <select className="border px-3 py-2 rounded" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
          <option value="">All Years</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </select>
        <select className="border px-3 py-2 rounded" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
          <option value="">All Months</option>
          {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select className="border px-3 py-2 rounded" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories
            .filter(c => viewMode === 'debit' ? c.type === 'Expense' : c.type === 'Income')
            .map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
        </select>
        <select className="border px-3 py-2 rounded" value={subcategoryFilter} onChange={e => setSubcategoryFilter(e.target.value)}>
          <option value="">All Subcategories</option>
          {subcategories.map(sub => (
            <option key={sub.id} value={sub.id}>{sub.name}</option>
          ))}
        </select>
        <button
          className={`px-4 py-2 rounded font-semibold ${viewMode === 'debit' ? 'bg-red-600 text-white' : 'bg-gray-200 text-black'}`}
          onClick={() => setViewMode('debit')}
        >
          Debit View
        </button>
        <button
          className={`px-4 py-2 rounded font-semibold ${viewMode === 'credit' ? 'bg-green-600 text-white' : 'bg-gray-200 text-black'}`}
          onClick={() => setViewMode('credit')}
        >
          Credit View
        </button>
      </div>

      {/* Category Table */}
      <div className="mb-12">
        <h3 className="text-xl font-bold text-black mb-4">Month-wise Totals by Category ({viewMode})</h3>
        <table className="w-full text-left border-collapse bg-white shadow-md rounded-lg border border-gray-200">
          <thead>
            <tr className="border-b bg-gray-100">
              <th className="py-2 px-3">Month</th>
              {categories
                .filter(c => viewMode === 'debit' ? c.type === 'Expense' : c.type === 'Income')
                .map(cat => (
                  <th key={cat.name} className="py-2 px-3">{cat.name}</th>
                ))}
              <th className="py-2 px-3">Top Category</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(monthlyCategoryTotals).map(([month, data]) => (
              <tr key={month} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3">{month}</td>
                {categories
                  .filter(c => viewMode === 'debit' ? c.type === 'Expense' : c.type === 'Income')
                  .map(cat => (
                    <td key={cat.name} className="py-2 px-3">₹{(data[cat.name] || 0).toFixed(2)}</td>
                  ))}
                <td className="py-2 px-3 font-semibold text-red-600">{getTopSpender(data)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Subcategory Table (vertical layout) */}
      <div>
        <h3 className="text-xl font-bold text-black mb-4">
          Month-wise Totals by Subcategory ({viewMode})
        </h3>
        <table className="w-full text-left border-collapse bg-white shadow-md rounded-lg border border-gray-200">
          <thead>
            <tr className="border-b bg-gray-100">
              <th className="py-2 px-3">Subcategory</th>
              {Object.keys(
                transactions.reduce((acc, t) => {
                  const month = t.date?.slice(0, 7);
                  if (month) acc[month] = true;
                  return acc;
                }, {})
              ).map(month => (
                <th key={month} className="py-2 px-3">{month}</th>
              ))}
              <th className="py-2 px-3">Top Month</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(subcategoryMonthTotals).map(([sub, monthData]) => (
              <tr key={sub} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3">{sub}</td>
                {Object.keys(
                  transactions.reduce((acc, t) => {
                    const month = t.date?.slice(0, 7);
                    if (month) acc[month] = true;
                    return acc;
                  }, {})
                ).map(month => (
                  <td key={month} className="py-2 px-3">₹{(monthData[month] || 0).toFixed(2)}</td>
                ))}
                <td className="py-2 px-3 font-semibold text-green-600">
                  {getTopSpender(monthData)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
