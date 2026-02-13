import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

export default function MoneyTracker({ user }) {
  const [safeKeeping, setSafeKeeping] = useState([]);
  const [lent, setLent] = useState([]);
  const [savings, setSavings] = useState([]);

  // Filters
  const [safeFilter, setSafeFilter] = useState('');
  const [lentFilter, setLentFilter] = useState('');

  // Form + edit states
  const [safePerson, setSafePerson] = useState('');
  const [safeAmount, setSafeAmount] = useState('');
  const [safeNotes, setSafeNotes] = useState('');
  const [safeEditingId, setSafeEditingId] = useState(null);

  const [lentPerson, setLentPerson] = useState('');
  const [lentAmount, setLentAmount] = useState('');
  const [lentNotes, setLentNotes] = useState('');
  const [lentEditingId, setLentEditingId] = useState(null);

  const [savingAmount, setSavingAmount] = useState('');
  const [savingNotes, setSavingNotes] = useState('');
  const [savingEditingId, setSavingEditingId] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetchSafeKeeping();
    fetchLent();
    fetchSavings();
  }, [user, safeFilter, lentFilter]);

  // Fetch functions
  async function fetchSafeKeeping() {
    let query = supabase.from('safe_keeping').select('*').eq('user_id', user.id);
    if (safeFilter) query = query.eq('person_name', safeFilter);
    const { data } = await query;
    setSafeKeeping(data || []);
  }

  async function fetchLent() {
    let query = supabase.from('lent').select('*').eq('user_id', user.id);
    if (lentFilter) query = query.eq('person_name', lentFilter);
    const { data } = await query;
    setLent(data || []);
  }

  async function fetchSavings() {
    const { data } = await supabase.from('savings').select('*').eq('user_id', user.id);
    setSavings(data || []);
  }

  // Add or Update Safe Keeping
  async function handleSafeKeeping(e) {
    e.preventDefault();
    if (safeEditingId) {
      await supabase.from('safe_keeping').update({
        person_name: safePerson,
        amount: safeAmount,
        notes: safeNotes
      }).eq('id', safeEditingId);
      setSafeEditingId(null);
    } else {
      await supabase.from('safe_keeping').insert({
        user_id: user.id,
        person_name: safePerson,
        amount: safeAmount,
        notes: safeNotes,
        date: new Date().toISOString().slice(0,10)
      });
    }
    setSafePerson(''); setSafeAmount(''); setSafeNotes('');
    fetchSafeKeeping();
  }

  // Add or Update Lent
  async function handleLent(e) {
    e.preventDefault();
    if (lentEditingId) {
      await supabase.from('lent').update({
        person_name: lentPerson,
        amount: lentAmount,
        notes: lentNotes
      }).eq('id', lentEditingId);
      setLentEditingId(null);
    } else {
      await supabase.from('lent').insert({
        user_id: user.id,
        person_name: lentPerson,
        amount: lentAmount,
        notes: lentNotes,
        date: new Date().toISOString().slice(0,10)
      });
    }
    setLentPerson(''); setLentAmount(''); setLentNotes('');
    fetchLent();
  }

  // Add or Update Savings
  async function handleSavings(e) {
  e.preventDefault();
  if (savingEditingId) {
    await supabase.from('savings').update({
      amount: Number(savingAmount),   // ensure numeric
      notes: savingNotes
    }).eq('id', savingEditingId);
    setSavingEditingId(null);
  } else {
    await supabase.from('savings').insert({
      user_id: user.id,
      amount: Number(savingAmount),   // ensure numeric
      notes: savingNotes,
      date: new Date().toISOString().slice(0,10)
    });
  }
  setSavingAmount('');
  setSavingNotes('');
  fetchSavings();
}

  // Delete functions
  async function deleteSafeKeeping(id) {
    await supabase.from('safe_keeping').delete().eq('id', id);
    fetchSafeKeeping();
  }
  async function deleteLent(id) {
    await supabase.from('lent').delete().eq('id', id);
    fetchLent();
  }
  async function deleteSavings(id) {
    await supabase.from('savings').delete().eq('id', id);
    fetchSavings();
  }

  // Person-wise summaries
const safeSummary = safeKeeping.reduce((acc, r) => {
  acc[r.person_name] = (acc[r.person_name] || 0) + Number(r.amount || 0);
  return acc;
}, {});
const lentSummary = lent.reduce((acc, r) => {
  acc[r.person_name] = (acc[r.person_name] || 0) + Number(r.amount || 0);
  return acc;
}, {});

// Overall totals
const totalSafe = safeKeeping.reduce((sum, r) => sum + Number(r.amount || 0), 0);
const totalLent = lent.reduce((sum, r) => sum + Number(r.amount || 0), 0);
const totalSavings = savings.reduce((sum, r) => sum + Number(r.amount || 0), 0);

return (
  <div className="max-w-6xl mx-auto p-6 space-y-10">

    {/* Overall Statistics */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div className="bg-green-100 border-l-4 border-green-500 p-6 rounded shadow">
        <h3 className="text-lg font-bold text-green-700">Safe Keeping</h3>
        <p className="text-2xl font-semibold">₹{totalSafe}</p>
      </div>
      <div className="bg-blue-100 border-l-4 border-blue-500 p-6 rounded shadow">
        <h3 className="text-lg font-bold text-blue-700">Lent</h3>
        <p className="text-2xl font-semibold">₹{totalLent}</p>
      </div>
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-6 rounded shadow">
        <h3 className="text-lg font-bold text-yellow-700">Savings</h3>
        <p className="text-2xl font-semibold">₹{totalSavings}</p>
      </div>
    </div>
      {/* Safe Keeping */}
      <section>
        <h2 className="text-xl font-bold mb-4">Safe Keeping</h2>
        <form onSubmit={handleSafeKeeping} className="flex gap-3 mb-4">
          <input value={safePerson} onChange={e=>setSafePerson(e.target.value)} placeholder="Person" className="border px-3 py-2 rounded"/>
          <input type="number" value={safeAmount} onChange={e=>setSafeAmount(e.target.value)} placeholder="Amount" className="border px-3 py-2 rounded"/>
          <input value={safeNotes} onChange={e=>setSafeNotes(e.target.value)} placeholder="Notes" className="border px-3 py-2 rounded"/>
          <button type="submit" className="bg-black text-white px-4 py-2 rounded">
            {safeEditingId ? 'Update' : 'Add'}
          </button>
        </form>
        {/* Person-wise Totals Table */}
{/* Safe Keeping Totals */}
<div className="flex flex-col md:flex-row gap-6 mb-10">

  {/* Safe Keeping Totals */}
  <div className="bg-white shadow-md rounded-lg p-4 md:w-1/3">
    <h3 className="text-lg font-bold mb-3">Safe Keeping Totals</h3>
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="px-3 py-2 text-left font-semibold text-gray-700">Person</th>
          <th className="px-3 py-2 text-right font-semibold text-gray-700">Total</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(safeSummary).map(([name, total], idx) => (
          <tr key={name} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
            <td className="px-3 py-2 font-medium text-gray-800">{name}</td>
            <td className="px-3 py-2 text-right text-gray-900">₹{total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Safe Keeping Detailed Entries */}
  <div className="bg-white shadow-md rounded-lg p-4 md:w-2/3">
    <h3 className="text-lg font-bold mb-3">Safe Keeping Entries</h3>
    <table className="w-full text-sm border-collapse">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-2 text-left font-semibold text-gray-700">Person</th>
          <th className="px-4 py-2 text-right font-semibold text-gray-700">Amount</th>
          <th className="px-4 py-2 text-center font-semibold text-gray-700">Date</th>
          <th className="px-4 py-2 text-left font-semibold text-gray-700">Notes</th>
          <th className="px-4 py-2 text-center font-semibold text-gray-700">Action</th>
        </tr>
      </thead>
      <tbody>
        {safeKeeping.map((r, idx) => (
          <tr key={r.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
            <td className="px-4 py-2 font-medium text-gray-800">{r.person_name}</td>
            <td className="px-4 py-2 text-right text-gray-900">₹{r.amount}</td>
            <td className="px-4 py-2 text-center text-gray-700">{r.date}</td>
            <td className="px-4 py-2 text-gray-700">{r.notes}</td>
            <td className="px-4 py-2 text-center">
              <button
                onClick={() => {
                  setSafeEditingId(r.id);
                  setSafePerson(r.person_name);
                  setSafeAmount(r.amount);
                  setSafeNotes(r.notes);
                }}
                className="text-blue-600 hover:text-blue-800 font-medium mr-3"
              >
                Edit
              </button>
              <button
                onClick={() => deleteSafeKeeping(r.id)}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

</div>
      </section>

      {/* Lent */}
      <section>
        <h2 className="text-xl font-bold mb-4">Lent</h2>
        <form onSubmit={handleLent} className="flex gap-3 mb-4">
          <input value={lentPerson} onChange={e=>setLentPerson(e.target.value)} placeholder="Person" className="border px-3 py-2 rounded"/>
          <input type="number" value={lentAmount} onChange={e=>setLentAmount(e.target.value)} placeholder="Amount" className="border px-3 py-2 rounded"/>
          <input value={lentNotes} onChange={e=>setLentNotes(e.target.value)} placeholder="Notes" className="border px-3 py-2 rounded"/>
                    <button type="submit" className="bg-black text-white px-4 py-2 rounded">
            {lentEditingId ? 'Update' : 'Add'}
          </button>
        </form>
        {/* Lent Totals */}
<div className="flex flex-col md:flex-row gap-6 mb-10">

  {/* Lent Totals */}
  <div className="bg-white shadow-md rounded-lg p-4 md:w-1/3">
    <h3 className="text-lg font-bold mb-3">Lent Totals</h3>
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="px-3 py-2 text-left font-semibold text-gray-700">Person</th>
          <th className="px-3 py-2 text-right font-semibold text-gray-700">Total</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(lentSummary).map(([name, total], idx) => (
          <tr key={name} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
            <td className="px-3 py-2 font-medium text-gray-800">{name}</td>
            <td className="px-3 py-2 text-right text-gray-900">₹{total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Lent Detailed Entries */}
  <div className="bg-white shadow-md rounded-lg p-4 md:w-2/3">
    <h3 className="text-lg font-bold mb-3">Lent Entries</h3>
    <table className="w-full text-sm border-collapse">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-2 text-left font-semibold text-gray-700">Person</th>
          <th className="px-4 py-2 text-right font-semibold text-gray-700">Amount</th>
          <th className="px-4 py-2 text-center font-semibold text-gray-700">Date</th>
          <th className="px-4 py-2 text-left font-semibold text-gray-700">Notes</th>
          <th className="px-4 py-2 text-center font-semibold text-gray-700">Action</th>
        </tr>
      </thead>
      <tbody>
        {lent.map((r, idx) => (
          <tr key={r.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
            <td className="px-4 py-2 font-medium text-gray-800">{r.person_name}</td>
            <td className="px-4 py-2 text-right text-gray-900">₹{r.amount}</td>
            <td className="px-4 py-2 text-center text-gray-700">{r.date}</td>
            <td className="px-4 py-2 text-gray-700">{r.notes}</td>
            <td className="px-4 py-2 text-center">
              <button
                onClick={() => {
                  setLentEditingId(r.id);
                  setLentPerson(r.person_name);
                  setLentAmount(r.amount);
                  setLentNotes(r.notes);
                }}
                className="text-blue-600 hover:text-blue-800 font-medium mr-3"
              >
                Edit
              </button>
              <button
                onClick={() => deleteLent(r.id)}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

</div>
      </section>

      <section>
  <h2 className="text-xl font-bold mb-4">Savings</h2>
  <form onSubmit={handleSavings} className="flex gap-3 mb-4">
    <input
      type="number"
      value={savingAmount}
      onChange={e => setSavingAmount(e.target.value)}
      placeholder="Amount"
      className="border px-3 py-2 rounded"
    />
    <input
      value={savingNotes}
      onChange={e => setSavingNotes(e.target.value)}
      placeholder="Notes"
      className="border px-3 py-2 rounded"
    />
    <button type="submit" className="bg-black text-white px-4 py-2 rounded">
      {savingEditingId ? 'Update' : 'Add'}
    </button>
  </form>

  {/* Savings Detailed Entries */}
  <div className="bg-white shadow-md rounded-lg p-4 max-w-3xl">
    <h3 className="text-lg font-bold mb-3">Savings Entries</h3>
    <table className="w-full text-sm border-collapse">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-2 text-right font-semibold text-gray-700">Amount</th>
          <th className="px-4 py-2 text-center font-semibold text-gray-700">Date</th>
          <th className="px-4 py-2 text-left font-semibold text-gray-700">Notes</th>
          <th className="px-4 py-2 text-center font-semibold text-gray-700">Action</th>
        </tr>
      </thead>
      <tbody>
        {savings.map((r, idx) => (
          <tr key={r.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
            <td className="px-4 py-2 text-right text-gray-900">₹{r.amount}</td>
            <td className="px-4 py-2 text-center text-gray-700">{r.date}</td>
            <td className="px-4 py-2 text-gray-700">{r.notes || '-'}</td>
            <td className="px-4 py-2 text-center">
              <button
                onClick={() => {
                  setSavingEditingId(r.id);
                  setSavingAmount(r.amount);
                  setSavingNotes(r.notes);
                }}
                className="text-blue-600 hover:text-blue-800 font-medium mr-3"
              >
                Edit
              </button>
              <button
                onClick={() => deleteSavings(r.id)}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>
    </div>
  );
}