import React, { useMemo, useState } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { Card } from '../ui/Card';
import { Edit3, Trash2, Search, Filter, X, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';

export default function TransactionsPage({ user, onEdit }) {
  const staticDate = useMemo(() => new Date(), []);
  const { allTransactions, loading, refresh } = useTransactions(user?.id, staticDate);
  const navigate = useNavigate();

  // --- FILTER STATES ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Get unique categories for the dropdown menu
  const uniqueCategories = useMemo(() => {
    const cats = allTransactions.map(t => t.categories?.name).filter(Boolean);
    return ['all', ...new Set(cats)];
  }, [allTransactions]);

  // 2. FILTER LOGIC (Calculated instantly whenever a filter changes)
  const filteredData = useMemo(() => {
    return allTransactions.filter(t => {
      const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || t.categories?.name === selectedCategory;
      const matchesStartDate = !startDate || t.date >= startDate;
      const matchesEndDate = !endDate || t.date <= endDate;

      return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate;
    });
  }, [allTransactions, searchTerm, selectedCategory, startDate, endDate]);

  const handleDelete = async (id) => {
    if (window.confirm("Permanently delete this record?")) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (!error) refresh();
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setStartDate('');
    setEndDate('');
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center font-black text-slate-900 text-2xl uppercase italic animate-pulse">
      Opening Ledger History...
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Transaction History</h1>
          <p className="text-slate-500 font-bold text-sm tracking-tight">Manage your transactions</p>
        </div>
        
        {/* Reset Button */}
        {(searchTerm || selectedCategory !== 'all' || startDate || endDate) && (
          <button 
            onClick={resetFilters}
            className="flex items-center gap-2 text-xs font-black text-rose-600 uppercase hover:bg-rose-50 px-3 py-2 rounded-xl transition-all"
          >
            <X size={14} /> Clear Filters
          </button>
        )}
      </div>

      {/* --- FILTER CONTROL BAR --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm">
        {/* Search */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Details</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text" 
              placeholder="Description..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <select 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm appearance-none cursor-pointer"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Start Date */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">From Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="date" 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        {/* End Date */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">To Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="date" 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <Card className="p-0 overflow-hidden border-2 border-slate-200 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest">Date</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest">Description</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">Debit (-)</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">Credit (+)</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length > 0 ? (
                filteredData.map(t => (
                  <tr key={t.id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="p-4 text-xs font-black text-slate-500 uppercase">{t.date}</td>
                    <td className="p-4">
                      <p className="text-sm font-black text-slate-900 leading-none mb-1">{t.description || 'General Item'}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">{t.categories?.name} / {t.subcategories?.name}</p>
                    </td>
                    <td className="p-4 text-sm font-black text-right text-rose-600">
                      {t.debit > 0 ? `₹${t.debit.toLocaleString()}` : '—'}
                    </td>
                    <td className="p-4 text-sm font-black text-right text-emerald-600">
                      {t.credit > 0 ? `₹${t.credit.toLocaleString()}` : '—'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { onEdit(t); navigate('/form'); }} className="p-2 border-2 border-slate-100 rounded-lg hover:border-slate-900 transition-all">
                          <Edit3 size={18} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-2 border-2 border-slate-100 rounded-lg hover:border-rose-600 hover:text-rose-600 transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest italic bg-slate-50/50">
                    No results match your current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Total Summary of Filtered View */}
      <div className="flex justify-end pr-4">
        <p className="text-sm font-bold text-slate-400 italic">
          Showing {filteredData.length} records in this view.
        </p>
      </div>
    </div>
  );
}