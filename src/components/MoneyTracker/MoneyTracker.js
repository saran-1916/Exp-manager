import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';

export default function MoneyTracker({ user }) {
  const [safeKeeping, setSafeKeeping] = useState([]);
  const [lent, setLent] = useState([]);
  const [savings, setSavings] = useState([]);

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

  // Fetch functions wrapped in useCallback
  const fetchSafeKeeping = useCallback(async () => {
    const { data } = await supabase
      .from('safe_keeping')
      .select('id, person_name, amount, notes, date, safe_returns(amount)')
      .eq('user_id', user?.id);

    const withRemaining = (data || []).map(r => {
      const returned = (r.safe_returns || []).reduce((sum, x) => sum + Number(x.amount || 0), 0);
      return { ...r, returned, remaining: Number(r.amount) - returned };
    });
    setSafeKeeping(withRemaining);
  }, [user]);

  const fetchLent = useCallback(async () => {
    const { data } = await supabase
      .from('lent')
      .select('id, person_name, amount, notes, date, lent_returns(amount)')
      .eq('user_id', user?.id);

    const withRemaining = (data || []).map(r => {
      const returned = (r.lent_returns || []).reduce((sum, x) => sum + Number(x.amount || 0), 0);
      return { ...r, returned, remaining: Number(r.amount) - returned };
    });
    setLent(withRemaining);
  }, [user]);

  const fetchSavings = useCallback(async () => {
    const { data } = await supabase
      .from('savings')
      .select('id, amount, notes, date, savings_returns(amount)')
      .eq('user_id', user?.id);

    const withRemaining = (data || []).map(r => {
      const returned = (r.savings_returns || []).reduce((sum, x) => sum + Number(x.amount || 0), 0);
      return { ...r, returned, remaining: Number(r.amount) - returned };
    });
    setSavings(withRemaining);
  }, [user]);

  // useEffect now includes the callbacks
  useEffect(() => {
    if (!user) return;
    fetchSafeKeeping();
    fetchLent();
    fetchSavings();
  }, [user, fetchSafeKeeping, fetchLent, fetchSavings]);

  // Add / Update handlers
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

  async function handleSavings(e) {
    e.preventDefault();
    if (savingEditingId) {
      await supabase.from('savings').update({
        amount: Number(savingAmount),
        notes: savingNotes
      }).eq('id', savingEditingId);
      setSavingEditingId(null);
    } else {
      await supabase.from('savings').insert({
        user_id: user.id,
        amount: Number(savingAmount),
        notes: savingNotes,
        date: new Date().toISOString().slice(0,10)
      });
    }
    setSavingAmount('');
    setSavingNotes('');
    fetchSavings();
  }

  // Return handlers
  async function handleSafeReturn(safeId, amount) {
    await supabase.from('safe_returns').insert({
      safe_id: safeId,
      amount: Number(amount),
      date: new Date().toISOString().slice(0,10)
    });
    fetchSafeKeeping();
  }

  async function handleLentReturn(lentId, amount) {
    await supabase.from('lent_returns').insert({
      lent_id: lentId,
      amount: Number(amount),
      date: new Date().toISOString().slice(0,10)
    });
    fetchLent();
  }

  async function handleSavingsReturn(savingId, amount) {
    await supabase.from('savings_returns').insert({
      saving_id: savingId,
      amount: Number(amount),
      date: new Date().toISOString().slice(0,10)
    });
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

  // Totals
  const totalSafe = safeKeeping.reduce((sum, r) => sum + Number(r.remaining || 0), 0);
  const totalLent = lent.reduce((sum, r) => sum + Number(r.remaining || 0), 0);
  const totalSavings = savings.reduce((sum, r) => sum + Number(r.remaining || 0), 0);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-green-100 border-l-4 border-green-500 p-6 rounded shadow">
          <h3 className="text-lg font-bold text-green-700">Safe Keeping Remaining</h3>
          <p className="text-2xl font-semibold">₹{totalSafe}</p>
        </div>
        <div className="bg-blue-100 border-l-4 border-blue-500 p-6 rounded shadow">
          <h3 className="text-lg font-bold text-blue-700">Lent Remaining</h3>
          <p className="text-2xl font-semibold">₹{totalLent}</p>
        </div>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-6 rounded shadow">
          <h3 className="text-lg font-bold text-yellow-700">Savings Remaining</h3>
          <p className="text-2xl font-semibold">₹{totalSavings}</p>
        </div>
      </div>

      {/* Safe Keeping Form */}
      <form onSubmit={handleSafeKeeping} className="mb-6 space-x-3">
        <input type="text" value={safePerson} onChange={e => setSafePerson(e.target.value)} placeholder="Person" className="border p-2" required />
        <input type="number" value={safeAmount} onChange={e => setSafeAmount(e.target.value)} placeholder="Amount" className="border p-2" required />
        <input type="text" value={safeNotes} onChange={e => setSafeNotes(e.target.value)} placeholder="Notes" className="border p-2" />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
          {safeEditingId ? "Update Safe Keeping" : "Add Safe Keeping"}
        </button>
        </button>
      </form>

      {/* Safe Keeping Table */}
      <section>
        <h2 className="text-xl font-bold mb-4">Safe Keeping</h2>
        <table className="w-full text-sm border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-center">Person</th>
              <th className="px-4 py-2 text-center">Given</th>
              <th className="px-4 py-2 text-center">Returned</th>
              <th className="px-4 py-2 text-center">Remaining</th>
              <th className="px-4 py-2 text-center">Date</th>
              <th className="px-4 py-2 text-center">Notes</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {safeKeeping.map(r => (
              <tr key={r.id} className="border-t border-gray-200">
                <td className="px-4 py-2 text-center">{r.person_name}</td>
                <td className="px-4 py-2 text-center">₹{r.amount}</td>
                <td className="px-4 py-2 text-center">₹{r.returned}</td>
                <td className="px-4 py-2 text-center">₹{r.remaining}</td>
                <td className="px-4 py-2 text-center">{r.date}</td>
                <td className="px-4 py-2 text-center">{r.notes}</td>
                <td className="px-4 py-2 text-center space-x-2">
                  <button
                    onClick={() => {
                      setSafeEditingId(r.id);
                      setSafePerson(r.person_name);
                      setSafeAmount(r.amount);
                      setSafeNotes(r.notes);
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      const amt = prompt("Enter return amount");
                      if (amt) handleSafeReturn(r.id, amt);
                    }}
                    className="text-purple-600 hover:underline"
                  >
                    Return
                  </button>
                  <button
                    onClick={() => deleteSafeKeeping(r.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Lent Form */}
      <form onSubmit={handleLent} className="mb-6 space-x-3">
        <input type="text" value={lentPerson} onChange={e => setLentPerson(e.target.value)} placeholder="Person" className="border p-2" required />
        <input type="number" value={lentAmount} onChange={e => setLentAmount(e.target.value)} placeholder="Amount" className="border p-2" required />
        <input type="text" value={lentNotes} onChange={e => setLentNotes(e.target.value)} placeholder="Notes" className="border p-2" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          {lentEditingId ? "Update Lent" : "Add Lent"}
        </button>
      </form>

      {/* Lent Table */}
      <section>
        <h2 className="text-xl font-bold mb-4">Lent</h2>
        <table className="w-full text-sm border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-center">Person</th>
              <th className="px-4 py-2 text-center">Given</th>
              <th className="px-4 py-2 text-center">Returned</th>
              <th className="px-4 py-2 text-center">Remaining</th>
              <th className="px-4 py-2 text-center">Date</th>
              <th className="px-4 py-2 text-center">Notes</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {lent.map(r => (
              <tr key={r.id} className="border-t border-gray-200">
                <td className="px-4 py-2 text-center">{r.person_name}</td>
                <td className="px-4 py-2 text-center">₹{r.amount}</td>
                <td className="px-4 py-2 text-center">₹{r.returned}</td>
                <td className="px-4 py-2 text-center">₹{r.remaining}</td>
                <td className="px-4 py-2 text-center">{r.date}</td>
                <td className="px-4 py-2 text-center">{r.notes}</td>
                <td className="px-4 py-2 text-center space-x-2">
                  <button
                    onClick={() => {
                      setLentEditingId(r.id);
                      setLentPerson(r.person_name);
                      setLentAmount(r.amount);
                      setLentNotes(r.notes);
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      const amt = prompt("Enter return amount");
                      if (amt) handleLentReturn(r.id, amt);
                    }}
                    className="text-purple-600 hover:underline"
                  >
                    Return
                  </button>
                  <button
                    onClick={() => deleteLent(r.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Savings Form */}
      <form onSubmit={handleSavings} className="mb-6 space-x-3">
        <input type="number" value={savingAmount} onChange={e => setSavingAmount(e.target.value)} placeholder="Amount" className="border p-2" required />
        <input type="text" value={savingNotes} onChange={e => setSavingNotes(e.target.value)} placeholder="Notes" className="border p-2" />
        <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded">
          {savingEditingId ? "Update Saving" : "Add Saving"}
        </button>
      </form>

      {/* Savings Table */}
      <section>
        <h2 className="text-xl font-bold mb-4">Savings</h2>
        <table className="w-full text-sm border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-center">Amount</th>
              <th className="px-4 py-2 text-center">Withdrawn</th>
              <th className="px-4 py-2 text-center">Remaining</th>
              <th className="px-4 py-2 text-center">Date</th>
              <th className="px-4 py-2 text-center">Notes</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {savings.map(r => (
              <tr key={r.id} className="border-t border-gray-200">
                <td className="px-4 py-2 text-center">₹{r.amount}</td>
                <td className="px-4 py-2 text-center">₹{r.returned}</td>
                <td className="px-4 py-2 text-center">₹{r.remaining}</td>
                <td className="px-4 py-2 text-center">{r.date}</td>
                <td className="px-4 py-2 text-center">{r.notes || '-'}</td>
                <td className="px-4 py-2 text-center space-x-2">
                  <button
                    onClick={() => {
                      setSavingEditingId(r.id);
                      setSavingAmount(r.amount);
                      setSavingNotes(r.notes);
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      const amt = prompt("Enter withdrawal amount");
                      if (amt) handleSavingsReturn(r.id, amt);
                    }}
                    className="text-purple-600 hover:underline"
                  >
                    Withdraw
                  </button>
                  <button
                    onClick={() => deleteSavings(r.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div
              
