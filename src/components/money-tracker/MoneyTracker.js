import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Card } from '../ui/Card';
import {
  User,
  Plus,
  Trash2,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Wallet,
  X,
  Edit3,
  Landmark,
  ReceiptText,
  History,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const todayDate = () => new Date().toISOString().slice(0, 10);

const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(Number(value) || 0);

const createEmptyEntryForm = () => ({
  person_name: '',
  amount: '',
  notes: '',
  id: null,
  date: todayDate(),
  return_amount: '',
  return_date: todayDate()
});

const TRACKER_CONFIG = {
  lent: {
    label: 'Lent',
    table: 'lent',
    returnTable: 'lent_returns',
    foreignKey: 'lent_id',
    hasPerson: true,
    icon: User,
    partyLabel: 'Borrower',
    amountLabel: 'Amount lent',
    returnLabel: 'Return received',
    actionLabel: 'Record return',
    remainingLabel: 'Still receivable',
    totalLabel: 'Total lent',
    itemFallback: 'Borrower'
  },
  safekeeping: {
    label: 'Safekeeping',
    table: 'safe_keeping',
    returnTable: 'safe_returns',
    foreignKey: 'safe_id',
    hasPerson: true,
    icon: User,
    partyLabel: 'Owner',
    amountLabel: 'Amount held',
    returnLabel: 'Amount returned',
    actionLabel: 'Record return',
    remainingLabel: 'Still held',
    totalLabel: 'Total held',
    itemFallback: 'Owner'
  },
  savings: {
    label: 'Savings',
    table: 'savings',
    returnTable: 'savings_returns',
    foreignKey: 'saving_id',
    hasPerson: false,
    icon: Landmark,
    partyLabel: 'Goal',
    amountLabel: 'Saved amount',
    returnLabel: 'Withdrawal / used amount',
    actionLabel: 'Record usage',
    remainingLabel: 'Available savings',
    totalLabel: 'Total saved',
    itemFallback: 'Savings balance'
  }
};

const TRACKER_TABS = Object.keys(TRACKER_CONFIG);

const getItemTitle = (item, config) => {
  if (config.hasPerson) return item.person_name || config.itemFallback;
  return item.notes || config.itemFallback;
};

export default function MoneyTracker({ user }) {
  const [activeTab, setActiveTab] = useState('lent');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [settlingId, setSettlingId] = useState(null);
  const [entryForm, setEntryForm] = useState(createEmptyEntryForm);
  const [partialAmount, setPartialAmount] = useState('');
  const [partialDate, setPartialDate] = useState(todayDate);
  const [returnDrafts, setReturnDrafts] = useState({});

  const refreshData = useCallback(async () => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const current = TRACKER_CONFIG[activeTab];

      const { data: records, error: recordsError } = await supabase
        .from(current.table)
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (recordsError) {
        console.error(`Error fetching ${activeTab} data:`, recordsError);
        setError(`Failed to load ${current.label} data from ${current.table}: ${recordsError.message}`);
        setData([]);
        return;
      }

      if (!records || records.length === 0) {
        setData([]);
        return;
      }

      const recordIds = records.map(record => record.id);
      const { data: returns, error: returnsError } = await supabase
        .from(current.returnTable)
        .select(`id, amount, date, ${current.foreignKey}`)
        .in(current.foreignKey, recordIds)
        .order('date', { ascending: false });

      if (returnsError) {
        console.error(`Error fetching ${activeTab} returns:`, returnsError);
        setError(`Failed to load ${current.label} return data from ${current.returnTable}: ${returnsError.message}`);
        setData([]);
        return;
      }

      const returnsByRecordId = (returns || []).reduce((grouped, returnRecord) => {
        const parentId = returnRecord[current.foreignKey];
        if (!grouped[parentId]) grouped[parentId] = [];
        grouped[parentId].push({
          id: returnRecord.id,
          amount: returnRecord.amount,
          date: returnRecord.date
        });
        return grouped;
      }, {});

      const enriched = records.map(record => {
        const itemReturns = returnsByRecordId[record.id] || [];
        const returned = itemReturns.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const totalAmount = Number(record.amount || 0);
        const remaining = totalAmount - returned;

        return {
          ...record,
          returns: itemReturns,
          total_returned: returned,
          remaining,
          progress: totalAmount > 0 ? Math.min((returned / totalAmount) * 100, 100) : 0,
          isSettled: remaining <= 0
        };
      });

      setData(enriched);
    } catch (err) {
      console.error('MoneyTracker error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, activeTab]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    setSelectedItem(null);
    setSettlingId(null);
    setPartialAmount('');
    setPartialDate(todayDate());
    setReturnDrafts({});
    setEntryForm(createEmptyEntryForm());
  }, [activeTab]);

  const handleSaveEntry = async (event) => {
    event.preventDefault();
    const current = TRACKER_CONFIG[activeTab];
    const amount = Number(entryForm.amount);
    const openingReturnAmount = Number(entryForm.return_amount || 0);
    let savedEntryId = entryForm.id;
    let saveError = null;

    setError(null);

    if (!amount || amount <= 0) {
      setError(`Enter a ${current.amountLabel.toLowerCase()} greater than zero.`);
      return;
    }

    const payload = {
      user_id: user.id,
      amount,
      notes: entryForm.notes,
      date: entryForm.date || todayDate()
    };

    if (current.hasPerson) payload.person_name = entryForm.person_name;

    if (entryForm.id) {
      const { error: updateError } = await supabase
        .from(current.table)
        .update(payload)
        .eq('id', entryForm.id);

      saveError = updateError;
    } else if (openingReturnAmount > 0) {
      const { data: insertedEntry, error: insertError } = await supabase
        .from(current.table)
        .insert([payload])
        .select('id')
        .single();

      saveError = insertError;
      savedEntryId = insertedEntry?.id;
    } else {
      const { error: insertError } = await supabase
        .from(current.table)
        .insert([payload]);

      saveError = insertError;
    }

    if (saveError) {
      console.error(`Error saving ${activeTab} entry:`, saveError);
      setError(`Failed to save ${current.label} entry to ${current.table}: ${saveError.message}`);
      return;
    }

    if (!entryForm.id && openingReturnAmount > 0 && savedEntryId) {
      const { error: returnInsertError } = await supabase.from(current.returnTable).insert([{
        [current.foreignKey]: savedEntryId,
        amount: openingReturnAmount,
        date: entryForm.return_date || payload.date
      }]);

      if (returnInsertError) {
        console.error(`Error saving opening ${activeTab} return:`, returnInsertError);
        setError(`Entry saved, but failed to save ${current.returnLabel.toLowerCase()} in ${current.returnTable}: ${returnInsertError.message}`);
        refreshData();
        return;
      }
    }

    setEntryForm(createEmptyEntryForm());
    setShowAddModal(false);
    refreshData();
  };

  const handleEditParent = (item, event) => {
    event.stopPropagation();
    setEntryForm({
      id: item.id,
      person_name: item.person_name || '',
      amount: item.amount,
      notes: item.notes || '',
      date: item.date,
      return_amount: '',
      return_date: todayDate()
    });
    setShowAddModal(true);
  };

  const handleAddPartial = async (parentId, amountValue = partialAmount, dateValue = partialDate, closePanel = true) => {
    const current = TRACKER_CONFIG[activeTab];
    const amount = Number(amountValue);

    setError(null);

    if (!amount || amount <= 0) {
      setError(`Enter a ${current.returnLabel.toLowerCase()} greater than zero.`);
      return false;
    }

    const { error: insertError } = await supabase.from(current.returnTable).insert([{
      [current.foreignKey]: parentId,
      amount,
      date: dateValue || todayDate()
    }]);

    if (insertError) {
      console.error(`Error adding ${activeTab} return:`, insertError);
      setError(`Failed to save ${current.label} return to ${current.returnTable}: ${insertError.message}`);
      return false;
    }

    setPartialAmount('');
    setPartialDate(todayDate());
    setReturnDrafts(prev => {
      const next = { ...prev };
      delete next[parentId];
      return next;
    });
    if (closePanel) setSelectedItem(null);
    refreshData();
    return true;
  };

  const handleDelete = async (id) => {
    if (window.confirm('Permanently delete this entire record?')) {
      const current = TRACKER_CONFIG[activeTab];
      setError(null);

      const { error: deleteError } = await supabase.from(current.table).delete().eq('id', id);
      if (deleteError) {
        console.error(`Error deleting ${activeTab} entry:`, deleteError);
        setError(`Failed to delete ${current.label} entry from ${current.table}: ${deleteError.message}`);
        return;
      }

      setSelectedItem(null);
      refreshData();
    }
  };

  const handleSettleTransaction = async (id) => {
    if (!id) return;

    const current = TRACKER_CONFIG[activeTab];
    setError(null);

    const { error: insertError } = await supabase.from(current.returnTable).insert([{
      [current.foreignKey]: id,
      amount: selectedItem.remaining,
      date: todayDate()
    }]);

    if (insertError) {
      console.error(`Error settling ${activeTab} entry:`, insertError);
      setError(`Failed to settle ${current.label} entry in ${current.returnTable}: ${insertError.message}`);
      return;
    }

    setSelectedItem(null);
    setSettlingId(null);
    refreshData();
  };

  const globalTotalBalance = useMemo(() => data.reduce((sum, item) => sum + item.remaining, 0), [data]);
  const globalTotalTracked = useMemo(() => data.reduce((sum, item) => sum + Number(item.amount || 0), 0), [data]);
  const globalTotalReturned = useMemo(() => data.reduce((sum, item) => sum + item.total_returned, 0), [data]);
  const currentConfig = TRACKER_CONFIG[activeTab];
  const ActiveIcon = currentConfig.icon;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24 font-sans text-black">
      <header className="space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#EAF4FF] text-[#0077FF]">
              <Wallet size={22} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#71717A]">Tracker ledger</p>
              <h1 className="mt-2 truncate text-3xl font-black tracking-tight text-black md:text-4xl">Money Tracker</h1>
              <p className="mt-2 truncate text-sm font-bold text-[#71717A]">{currentConfig.label} records</p>
            </div>
          </div>

          <button
            onClick={() => { setEntryForm(createEmptyEntryForm()); setShowAddModal(true); }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-black text-white transition active:scale-[0.98] md:w-auto"
          >
            <Plus size={17} strokeWidth={1.8} /> New Entry
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Card className="border border-[#F0F0F0] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="spera-card-text font-black uppercase tracking-[0.2em] text-[#71717A]">{currentConfig.remainingLabel}</p>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EAF4FF] text-[#0077FF]">
                <Wallet size={18} strokeWidth={1.8} />
              </span>
            </div>
            <p className="spera-truncate mt-3 text-2xl font-black text-black">{formatCurrency(globalTotalBalance)}</p>
          </Card>
          <Card className="border border-[#F0F0F0] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="spera-card-text font-black uppercase tracking-[0.2em] text-[#71717A]">{currentConfig.totalLabel}</p>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F8F8F8] text-black">
                <ActiveIcon size={18} strokeWidth={1.8} />
              </span>
            </div>
            <p className="spera-truncate mt-3 text-2xl font-black text-black">{formatCurrency(globalTotalTracked)}</p>
          </Card>
          <Card className="border border-[#F0F0F0] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="spera-card-text font-black uppercase tracking-[0.2em] text-[#71717A]">{currentConfig.returnLabel}</p>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <ArrowUpRight size={18} strokeWidth={1.8} />
              </span>
            </div>
            <p className="spera-truncate mt-3 text-2xl font-black text-emerald-600">{formatCurrency(globalTotalReturned)}</p>
          </Card>
        </div>
      </header>

      <div className="grid w-full grid-cols-3 gap-1 rounded-2xl border border-[#F0F0F0] bg-white p-1 md:flex md:w-fit">
        {TRACKER_TABS.map(tab => {
          const tabConfig = TRACKER_CONFIG[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`min-w-0 rounded-xl px-3 py-3 text-center text-[11px] font-black uppercase tracking-[0.16em] transition md:px-6 ${
                activeTab === tab ? 'bg-black text-white' : 'text-[#71717A] hover:bg-[#F8F8F8] hover:text-black'
              }`}
            >
              {tabConfig.label}
            </button>
          );
        })}
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {error && (
          <div className="col-span-full rounded-2xl border border-rose-100 bg-rose-50 p-4">
            <p className="flex items-center gap-2 text-sm font-black text-rose-600">
              <AlertCircle size={17} strokeWidth={1.8} /> {error}
            </p>
          </div>
        )}

        {loading ? (
          <div className="col-span-full rounded-3xl border border-dashed border-[#F0F0F0] bg-white px-6 py-20 text-center text-sm font-black uppercase tracking-[0.2em] text-[#71717A]">
            Syncing records
          </div>
        ) : error ? null : data.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-[#F0F0F0] bg-white px-6 py-20 text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#71717A]">No records</p>
            <button
              onClick={() => { setEntryForm(createEmptyEntryForm()); setShowAddModal(true); }}
              className="mx-auto mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0077FF] px-5 text-sm font-black text-white transition active:scale-[0.98]"
            >
              <Plus size={17} strokeWidth={1.8} /> Create Entry
            </button>
          </div>
        ) : data.map(item => (
          <Card
            key={item.id}
            className="group flex min-h-[360px] cursor-pointer flex-col border border-[#F0F0F0] bg-white p-5 transition hover:border-[#D4D4D8]"
            onClick={() => setSelectedItem(item)}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#111111] text-white">
                <ActiveIcon size={19} strokeWidth={1.8} />
              </span>
              <div className="flex min-w-0 items-center gap-2">
                <button
                  onClick={(event) => handleEditParent(item, event)}
                  className="grid h-10 w-10 place-items-center rounded-xl text-[#A1A1AA] transition hover:bg-[#F8F8F8] hover:text-black"
                  aria-label={`Edit ${getItemTitle(item, currentConfig)}`}
                >
                  <Edit3 size={16} strokeWidth={1.8} />
                </button>
                <span className={`flex h-9 items-center gap-1 rounded-xl px-3 text-[10px] font-black uppercase tracking-[0.16em] ${
                  item.isSettled ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {item.isSettled ? <CheckCircle2 size={13} strokeWidth={1.8} /> : <Clock size={13} strokeWidth={1.8} />}
                  {item.isSettled ? 'Settled' : 'Open'}
                </span>
              </div>
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-xl font-black tracking-tight text-black">{getItemTitle(item, currentConfig)}</h3>
              <p className="mt-1 truncate text-[11px] font-bold uppercase tracking-tight text-[#71717A]">{item.date}</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#F0F0F0] bg-white p-3">
                <p className="spera-card-text font-black uppercase tracking-[0.18em] text-[#71717A]">{currentConfig.amountLabel}</p>
                <p className="spera-truncate mt-2 text-base font-black text-black">{formatCurrency(item.amount)}</p>
              </div>
              <div className="rounded-2xl border border-[#F0F0F0] bg-white p-3">
                <p className="spera-card-text font-black uppercase tracking-[0.18em] text-[#71717A]">{currentConfig.returnLabel}</p>
                <p className="spera-truncate mt-2 text-base font-black text-emerald-600">{formatCurrency(item.total_returned)}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-end justify-between gap-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#71717A]">{currentConfig.remainingLabel}</p>
                <p className="shrink-0 text-lg font-black text-black">{formatCurrency(item.remaining)}</p>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#F4F4F5]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.progress}%` }}
                  className={`h-full rounded-full ${item.isSettled ? 'bg-emerald-500' : 'bg-[#0077FF]'}`}
                />
              </div>
            </div>

            {!item.isSettled && (
              <form
                onClick={(event) => event.stopPropagation()}
                onSubmit={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleAddPartial(item.id, returnDrafts[item.id], todayDate(), false);
                }}
                className="mt-auto rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] p-3"
              >
                <label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#71717A]">{currentConfig.returnLabel}</label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    className="h-11 min-w-0 flex-1 rounded-xl border border-[#F0F0F0] bg-white px-3 text-sm font-bold text-black outline-none transition focus:border-black"
                    value={returnDrafts[item.id] || ''}
                    onChange={(event) => setReturnDrafts(prev => ({ ...prev, [item.id]: event.target.value }))}
                  />
                  <button type="submit" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-black text-white transition active:scale-[0.96]" aria-label={currentConfig.actionLabel}>
                    <Plus size={16} strokeWidth={1.9} />
                  </button>
                </div>
              </form>
            )}
          </Card>
        ))}
      </section>

      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end bg-black/25 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="flex h-screen w-full max-w-md flex-col overflow-y-auto border-l border-[#F0F0F0] bg-white p-5 md:p-7"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#71717A]">
                    <History size={14} strokeWidth={1.8} /> Statement
                  </p>
                  <h2 className="mt-2 truncate text-2xl font-black tracking-tight text-black">{getItemTitle(selectedItem, currentConfig)}</h2>
                </div>
                <button
                  onClick={() => { setSelectedItem(null); setSettlingId(null); }}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#F0F0F0] text-black transition hover:border-[#D4D4D8]"
                  aria-label="Close statement"
                >
                  <X size={20} strokeWidth={1.8} />
                </button>
              </div>

              <div className="flex-1 space-y-5">
                <div className="rounded-3xl bg-black p-6 text-white">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/50">{currentConfig.remainingLabel}</p>
                  <p className="mt-3 text-4xl font-black tracking-tight">{formatCurrency(selectedItem.remaining)}</p>
                </div>

                {!selectedItem.isSettled && (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleAddPartial(selectedItem.id);
                    }}
                    className="rounded-2xl border border-[#F0F0F0] bg-white p-4"
                  >
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#71717A]">{currentConfig.returnLabel}</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        className="h-12 rounded-xl border border-[#F0F0F0] bg-white px-4 text-sm font-bold text-black outline-none transition focus:border-black"
                        value={partialAmount}
                        onChange={(event) => setPartialAmount(event.target.value)}
                      />
                      <input
                        type="date"
                        className="h-12 rounded-xl border border-[#F0F0F0] bg-white px-4 text-sm font-bold text-black outline-none transition focus:border-black"
                        value={partialDate}
                        onChange={(event) => setPartialDate(event.target.value)}
                      />
                    </div>
                    <button type="submit" className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0077FF] px-5 text-sm font-black text-white transition active:scale-[0.98]">
                      <Plus size={16} strokeWidth={1.9} /> {currentConfig.actionLabel}
                    </button>
                  </form>
                )}

                {!selectedItem.isSettled && selectedItem.remaining > 0 && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                      <CheckCircle2 size={14} strokeWidth={1.8} /> Mark as settled
                    </p>
                    {settlingId === selectedItem.id ? (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-emerald-700">Confirm final settlement of {formatCurrency(selectedItem.remaining)}.</p>
                        <button
                          onClick={() => handleSettleTransaction(selectedItem.id)}
                          className="h-11 w-full rounded-xl bg-emerald-600 px-4 text-sm font-black text-white transition active:scale-[0.98]"
                        >
                          Confirm Settlement
                        </button>
                        <button
                          onClick={() => setSettlingId(null)}
                          className="h-11 w-full rounded-xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-700 transition active:scale-[0.98]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSettlingId(selectedItem.id)}
                        className="h-11 w-full rounded-xl bg-emerald-600 px-4 text-sm font-black text-white transition active:scale-[0.98]"
                      >
                        Settle Transaction
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#71717A]">
                    <ReceiptText size={14} strokeWidth={1.8} /> Activity Log
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#F0F0F0] bg-white p-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-black">{currentConfig.amountLabel}</p>
                        <p className="mt-1 truncate text-[11px] font-bold uppercase tracking-tight text-[#71717A]">{selectedItem.date}</p>
                      </div>
                      <p className="shrink-0 text-sm font-black text-black">{formatCurrency(selectedItem.amount)}</p>
                    </div>
                    {(selectedItem.returns || []).map((record, index) => (
                      <div key={record.id || index} className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-emerald-700">{currentConfig.returnLabel}</p>
                          <p className="mt-1 truncate text-[11px] font-bold uppercase tracking-tight text-emerald-600">{record.date}</p>
                        </div>
                        <p className="shrink-0 text-sm font-black text-emerald-700">- {formatCurrency(record.amount)}</p>
                      </div>
                    ))}
                    {selectedItem.isSettled && (
                      <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-sm font-black text-emerald-700">Settled</p>
                        <CheckCircle2 size={20} strokeWidth={1.8} className="text-emerald-600" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => { handleDelete(selectedItem.id); setSettlingId(null); }}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-rose-100 bg-white px-4 text-sm font-black text-rose-600 transition hover:bg-rose-50 active:scale-[0.98]"
              >
                <Trash2 size={16} strokeWidth={1.8} /> Delete Record
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[#F0F0F0] bg-white p-5 md:p-7"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#71717A]">{entryForm.id ? 'Edit record' : 'New record'}</p>
                  <h2 className="mt-2 truncate text-2xl font-black tracking-tight text-black">{currentConfig.label}</h2>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#F0F0F0] text-black transition hover:border-[#D4D4D8]"
                  aria-label="Close form"
                >
                  <X size={20} strokeWidth={1.8} />
                </button>
              </div>

              <form onSubmit={handleSaveEntry} className="space-y-4">
                {currentConfig.hasPerson && (
                  <div className="space-y-1">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#71717A]">{currentConfig.partyLabel}</label>
                    <input
                      type="text"
                      required
                      placeholder="Name"
                      className="h-12 w-full rounded-2xl border border-[#F0F0F0] bg-white px-4 text-sm font-bold text-black outline-none transition focus:border-black"
                      value={entryForm.person_name}
                      onChange={(event) => setEntryForm({ ...entryForm, person_name: event.target.value })}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_160px]">
                  <div className="space-y-1">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#71717A]">{currentConfig.amountLabel}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="0"
                      className="h-12 w-full rounded-2xl border border-[#F0F0F0] bg-white px-4 text-sm font-bold text-black outline-none transition focus:border-black"
                      value={entryForm.amount}
                      onChange={(event) => setEntryForm({ ...entryForm, amount: event.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#71717A]">Date</label>
                    <input
                      type="date"
                      required
                      className="h-12 w-full rounded-2xl border border-[#F0F0F0] bg-white px-4 text-sm font-bold text-black outline-none transition focus:border-black"
                      value={entryForm.date}
                      onChange={(event) => setEntryForm({ ...entryForm, date: event.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#71717A]">
                    {currentConfig.hasPerson ? 'Description' : 'Savings label'}
                  </label>
                  <input
                    type="text"
                    placeholder={currentConfig.hasPerson ? 'Short note' : 'Emergency fund, trip, goal'}
                    className="h-12 w-full rounded-2xl border border-[#F0F0F0] bg-white px-4 text-sm font-bold text-black outline-none transition focus:border-black"
                    value={entryForm.notes}
                    onChange={(event) => setEntryForm({ ...entryForm, notes: event.target.value })}
                  />
                </div>

                {!entryForm.id && (
                  <div className="rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] p-4">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#71717A]">{currentConfig.returnLabel}</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_160px]">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        className="h-12 rounded-xl border border-[#F0F0F0] bg-white px-4 text-sm font-bold text-black outline-none transition focus:border-black"
                        value={entryForm.return_amount}
                        onChange={(event) => setEntryForm({ ...entryForm, return_amount: event.target.value })}
                      />
                      <input
                        type="date"
                        className="h-12 rounded-xl border border-[#F0F0F0] bg-white px-4 text-sm font-bold text-black outline-none transition focus:border-black"
                        value={entryForm.return_date}
                        onChange={(event) => setEntryForm({ ...entryForm, return_date: event.target.value })}
                      />
                    </div>
                  </div>
                )}

                <button type="submit" className="flex h-12 w-full items-center justify-center rounded-xl bg-black px-5 text-sm font-black text-white transition active:scale-[0.98]">
                  {entryForm.id ? 'Update Record' : 'Save Record'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
