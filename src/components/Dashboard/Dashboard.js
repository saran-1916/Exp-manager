import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';

function Dashboard({ userId }) {
  const [transactions, setTransactions] = useState([]);
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

      // Apply date filters to the database query
      if (yearFilter) query = query.like('date', `${yearFilter}-%`);
      if (monthFilter) query = query.like('date', `%-${monthFilter}-%`);

      const { data, error } = await query;
      if (error) return console.error("Fetch error:", error.message);

      // 1. Calculate Summary based on ALL data for the period (ignore viewMode here)
      const totalDebit = data.reduce((acc, t) => acc + Number(t.debit || 0), 0);
      const totalCredit = data.reduce((acc, t) => acc + Number(t.credit || 0), 0);
      
      setSummary({ 
        debit: totalDebit, 
        credit: totalCredit, 
        balance: totalCredit - totalDebit 
      });

      // 2. Filter data for the Tables based on viewMode and dropdowns
      const filtered = data.filter(t => {
        const typeMatch = viewMode === 'debit' ? t.categories?.type === 'Expense' : t.categories?.type === 'Income';
        const categoryMatch = categoryFilter ? t.category_id === categoryFilter : true;
        const subcategoryMatch = subcategoryFilter ? t.subcategory_id === subcategoryFilter : true;
        return typeMatch && categoryMatch && subcategoryMatch;
      });

      setTransactions(filtered);
    }

    fetchData();
  }, [userId, yearFilter, monthFilter, categoryFilter, subcategoryFilter, viewMode]);

  // Grouping logic for tables
  const monthlyCategoryTotals = {};
  const subcategoryMonthTotals = {};

  transactions.forEach(t => {
    const month = t.date?.slice(0, 7); 
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
    let top = 'N/A';
    for (const key in data) {
      if (data[key] > max) {
        max = data[key];
        top = key;
      }
    }
    return top;
  }

  // Get unique months for subcategory table headers
  const uniqueMonths = [...new Set(transactions.map(t => t.date?.slice(0, 7)))].sort();

  return (
    <div className="max-w-7xl mx-auto mt-10 p-6 bg-gray-50 min-h-screen">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white shadow-sm rounded-xl p-6 border border-red-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Expenses</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">₹{summary.debit.toLocaleString()}</p>
        </div>
        <div className="bg-white shadow-sm rounded-xl p-6 border border-green-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Income</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">₹{summary.credit.toLocaleString()}</p>
        </div>
        <div className="bg-white shadow-sm rounded-xl p-6 border border-blue-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Net Balance</h3>
          <p className={`text-3xl font-bold mt-2 ${summary.balance >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>
            ₹{summary.balance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-8 flex flex-wrap gap-4 items-center">
        <select className="border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
          <option value="">All Years</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </select>
        
        <select className="border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
          <option value="">All Months</option>
          {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select className="border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories
            .filter(c => viewMode === 'debit' ? c.type === 'Expense' : c.type === 'Income')
            .map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
        </select>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'debit' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setViewMode('debit'); setCategoryFilter(''); }}
          >
            Expenses
          </button>
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'credit' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setViewMode('credit'); setCategoryFilter(''); }}
          >
            Income
          </button>
        </div>
      </div>

      {/* Category Table */}
      <div className="mb-12 overflow-x-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly Totals by Category</h3>
        <table className="w-full text-left border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="py-3 px-4 font-semibold text-gray-600">Month</th>
              {categories
                .filter(c => viewMode === 'debit' ? c.type === 'Expense' : c.type === 'Income')
                .map(cat => (
                  <th key={cat.name} className="py-3 px-4 font-semibold text-gray-600">{cat.name}</th>
                ))}
              <th className="py-3 px-4 font-semibold text-blue-600">Top Category</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(monthlyCategoryTotals).map(([month, data]) => (
              <tr key={month} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-gray-700 font-medium">{month}</td>
                {categories
                  .filter(c => viewMode === 'debit' ? c.type === 'Expense' : c.type === 'Income')
                  .map(cat => (
                    <td key={cat.name} className="py-3 px-4 text-gray-600">₹{(data[cat.name] || 0).toLocaleString()}</td>
                  ))}
                <td className="py-3 px-4 font-bold text-gray-800">{getTopSpender(data)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Subcategory Table */}
      <div className="overflow-x-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly Totals by Subcategory</h3>
        <table className="w-full text-left border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="py-3 px-4 font-semibold text-gray-600">Subcategory</th>
              {uniqueMonths.map(month => (
                <th key={month} className="py-3 px-4 font-semibold text-gray-600">{month}</th>
              ))}
              <th className="py-3 px-4 font-semibold text-blue-600">Top Month</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(subcategoryMonthTotals).map(([sub, monthData]) => (
              <tr key={sub} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-gray-700 font-medium">{sub}</td>
                {uniqueMonths.map(month => (
                  <td key={month} className="py-3 px-4 text-gray-600">₹{(monthData[month] || 0).toLocaleString()}</td>
                ))}
                <td className="py-3 px-4 font-bold text-gray-800">{getTopSpender(monthData)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
