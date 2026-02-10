import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ debit: 0, credit: 0, balance: 0 });
  const [yearFilter, setYearFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [viewMode, setViewMode] = useState('debit'); // 'debit' or 'credit'
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);

  // ✅ Get logged-in user once
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

  // ✅ Set default filters to current year/month
  useEffect(() => {
    const now = new Date();
    const currentYear = String(now.getFullYear());
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    setYearFilter(currentYear);
    setMonthFilter(currentMonth);
  }, []);

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => setCategories(data || []));
    supabase.from('subcategories').select('*').then(({ data }) => setSubcategories(data || []));
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!user) return; // wait until user is loaded

      const { data: allData, error } = await supabase
        .from('transactions')
        .select(`
          id, date, debit, credit, category_id, subcategory_id,
          categories ( name, type ), subcategories ( name )
        `)
        .eq('user_id', user.id);

      if (error) return console.error("Fetch error:", error.message);

      // ✅ Build available years/months from ALL data
      const years = new Set();
      const months = new Set();
      allData.forEach(t => {
        if (t.date) {
          const [y, m] = t.date.split('-');
          years.add(y);
          months.add(m);
        }
      });
      setAvailableYears([...years].sort());
      setAvailableMonths([...months].sort());

      // ✅ Apply filters on top of allData
      let filteredData = [...allData];

      if (yearFilter && monthFilter) {
        const start = `${yearFilter}-${monthFilter}-01`;
        const end = `${yearFilter}-${monthFilter}-31`;
        filteredData = filteredData.filter(t => t.date >= start && t.date <= end);
      } else if (yearFilter) {
        const start = `${yearFilter}-01-01`;
        const end = `${yearFilter}-12-31`;
        filteredData = filteredData.filter(t => t.date >= start && t.date <= end);
      }

      if (categoryFilter) {
        filteredData = filteredData.filter(t => t.category_id === categoryFilter);
      }
      if (subcategoryFilter) {
        filteredData = filteredData.filter(t => t.subcategory_id === subcategoryFilter);
      }

      // ✅ Calculate previous balance
let previousBalance = 0;
if (yearFilter && monthFilter) {
  let targetYear = Number(yearFilter);
  let targetMonth = Number(monthFilter) - 1;

  if (targetMonth === 0) {
    targetYear -= 1;
    targetMonth = 12;
  }

  const prevEnd = `${targetYear}-${String(targetMonth).padStart(2, '0')}-31`;
  const prevData = allData.filter(t => t.date <= prevEnd);

  const prevDebit = prevData.reduce((acc, t) => acc + Number(t.debit || 0), 0);
  const prevCredit = prevData.reduce((acc, t) => acc + Number(t.credit || 0), 0);
  previousBalance = prevCredit - prevDebit;
}

// ✅ Current month summary with carry‑forward
const totalDebit = filteredData.reduce((acc, t) => acc + Number(t.debit || 0), 0);
const totalCredit = filteredData.reduce((acc, t) => acc + Number(t.credit || 0), 0);
const balance = previousBalance + (totalCredit - totalDebit);

setSummary({ debit: totalDebit, credit: totalCredit, balance });

      // ✅ Apply viewMode filter last
      const viewFiltered = filteredData.filter(t => {
        const type = t.categories?.type;
        return viewMode === 'debit' ? type === 'Expense' : type === 'Income';
      });

      setTransactions(viewFiltered);
    }

    fetchData();
  }, [user, yearFilter, monthFilter, categoryFilter, subcategoryFilter, viewMode]);

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

  // ✅ Visible months logic
  const visibleMonths = Object.keys(monthlyCategoryTotals).filter(month => {
    if (yearFilter && monthFilter) return month === `${yearFilter}-${monthFilter}`;
    if (yearFilter) return month.startsWith(`${yearFilter}-`);
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto mt-10 p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">Total Debit</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">₹{summary.debit}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">Total Credit</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">₹{summary.credit}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">Balance</h3>
          <p
            className={`text-2xl font-bold mt-2 ${
              summary.balance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            ₹{summary.balance}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <select
          className="border px-3 py-2 rounded"
          value={yearFilter}
          onChange={e => setYearFilter(e.target.value)}
        >
          <option value="">All Years</option>
          {availableYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          className="border px-3 py-2 rounded"
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value)}
          disabled={!yearFilter}
        >
          <option value="">All Months</option>
          {availableMonths.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          className="border px-3 py-2 rounded"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories
            .filter(c => viewMode === 'debit' ? c.type === 'Expense' : c.type === 'Income')
            .map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
        </select>
        <select
          className="border px-3 py-2 rounded"
          value={subcategoryFilter}
          onChange={e => setSubcategoryFilter(e.target.value)}
        >
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
        <h3 className="text-xl font-bold text-black mb-4">
          Month-wise Totals by Category ({viewMode})
        </h3>
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
            {visibleMonths.map(month => {
              const data = monthlyCategoryTotals[month] || {};
              return (
                <tr key={month} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3">{month}</td>
                  {categories
                    .filter(c => viewMode === 'debit' ? c.type === 'Expense' : c.type === 'Income')
                    .map(cat => (
                      <td key={cat.name} className="py-2 px-3">₹{data[cat.name] || 0}</td>
                    ))}
                  <td className="py-2 px-3 font-semibold text-red-600">
                    {getTopSpender(data)}
                  </td>
                </tr>
              );
            })}
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
              {visibleMonths.map(month => (
                <th key={month} className="py-2 px-3">{month}</th>
              ))}
              <th className="py-2 px-3">Top Month</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(subcategoryMonthTotals).map(sub => {
              const data = subcategoryMonthTotals[sub] || {};
              return (
                <tr key={sub} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3">{sub}</td>
                  {visibleMonths.map(month => (
                    <td key={month} className="py-2 px-3">₹{data[month] || 0}</td>
                  ))}
                  <td className="py-2 px-3 font-semibold text-green-600">
                    {getTopSpender(data)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
