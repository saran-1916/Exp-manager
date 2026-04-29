import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import {
  addMonths,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subMonths
} from 'date-fns';
import {
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Filter,
  Search,
  Trash2
} from 'lucide-react';
import { Card } from '../ui/Card';
import { CategoryIcon } from '../ui/CategoryIcon';
import { supabase } from '../../services/supabaseClient';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

const formatCurrency = (value) => currency.format(Number(value || 0));
const pdfNumber = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const formatPdfCurrency = (value) => `Rs. ${pdfNumber.format(Number(value || 0))}`;

export default function TransactionsPage({ user, onEdit }) {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()));
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchMonthTransactions = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    const monthStart = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('transactions')
      .select(`*, categories(name, type, icon_slug), subcategories(name)`)
      .eq('user_id', user.id)
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .order('date', { ascending: false });

    if (!error) setTransactions(data || []);
    setLoading(false);
  }, [selectedMonth, user?.id]);

  useEffect(() => {
    fetchMonthTransactions();
  }, [fetchMonthTransactions]);

  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return transactions.filter(t => {
      const text = [
        t.description,
        t.categories?.name,
        t.subcategories?.name,
        t.date
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = !query || text.includes(query);
      const matchesCategory = selectedCategory === 'all' || t.categories?.name === selectedCategory;
      const matchesStartDate = !startDate || t.date >= startDate;
      const matchesEndDate = !endDate || t.date <= endDate;

      return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate;
    });
  }, [transactions, searchTerm, selectedCategory, startDate, endDate]);

  const uniqueCategories = useMemo(() => {
    const cats = transactions.map(t => t.categories?.name).filter(Boolean);
    return ['all', ...new Set(cats)];
  }, [transactions]);

  const summary = useMemo(() => {
    const totalIncome = filteredTransactions.reduce((sum, t) => sum + Number(t.credit || 0), 0);
    const totalExpense = filteredTransactions.reduce((sum, t) => sum + Number(t.debit || 0), 0);
    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense
    };
  }, [filteredTransactions]);

  const groupedTransactions = useMemo(() => {
    return filteredTransactions.reduce((groups, transaction) => {
      const label = format(parseISO(transaction.date), 'dd MMMM yyyy');
      if (!groups[label]) groups[label] = [];
      groups[label].push(transaction);
      return groups;
    }, {});
  }, [filteredTransactions]);

  const handleDelete = async (id) => {
    if (window.confirm('Permanently delete this record?')) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (!error) fetchMonthTransactions();
    }
  };

  const downloadStatement = () => {
    const doc = new jsPDF();
    const monthName = format(selectedMonth, 'MMMM');
    const statementMonth = format(selectedMonth, 'MMM').toUpperCase();
    const year = format(selectedMonth, 'yyyy');
    const fileName = `SPERA_STMT_${statementMonth}_${year}.pdf`;

    doc.setFillColor(17, 17, 17);
    doc.rect(0, 0, 210, 42, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('SPERA', 16, 18);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`${monthName} ${year} Statement`, 16, 29);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Summary', 16, 56);

    const summaryRows = [
      ['Total Income', formatPdfCurrency(summary.totalIncome)],
      ['Total Expense', formatPdfCurrency(summary.totalExpense)],
      ['Net Balance', formatPdfCurrency(summary.netBalance)]
    ];

    let y = 66;
    summaryRows.forEach(([label, value]) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(113, 113, 122);
      doc.text(label, 16, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(value, 194, y, { align: 'right' });
      y += 9;
    });

    y += 8;
    doc.setFontSize(13);
    doc.text('Transactions', 16, y);
    y += 10;

    filteredTransactions.forEach((t) => {
      if (y > 276) {
        doc.addPage();
        y = 18;
      }

      const isCredit = Number(t.credit || 0) > 0;
      const amount = isCredit ? Number(t.credit || 0) : Number(t.debit || 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(t.description || t.categories?.name || 'Transaction', 16, y);
      doc.text(`${isCredit ? '+' : '-'} ${formatPdfCurrency(amount)}`, 194, y, { align: 'right' });
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(113, 113, 122);
      doc.text(`${format(parseISO(t.date), 'dd MMM yyyy')}  |  ${t.categories?.name || 'General'} / ${t.subcategories?.name || 'Other'}`, 16, y);
      y += 10;
    });

    if (filteredTransactions.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(113, 113, 122);
      doc.text('No transactions found for this statement view.', 16, y);
    }

    doc.save(fileName);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24 font-sans">
      <header className="space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#71717A]">Ledger timeline</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-black md:text-4xl">Transaction History</h1>
            <p className="mt-2 text-sm font-bold text-[#71717A]">{format(selectedMonth, 'MMMM yyyy')} statement view</p>
          </div>

          <button
            onClick={downloadStatement}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-black text-white transition active:scale-[0.98]"
          >
            <Download size={17} strokeWidth={1.7} />
            Download Statement
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[auto_1fr] lg:items-stretch">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#F0F0F0] bg-white p-2 sm:w-fit sm:justify-start">
            <button
              onClick={() => setSelectedMonth(prev => startOfMonth(subMonths(prev, 1)))}
              className="grid h-11 w-11 place-items-center rounded-xl border border-[#F0F0F0] text-black transition hover:border-[#0077FF] hover:text-[#0077FF]"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} strokeWidth={1.7} />
            </button>
            <div className="min-w-0 px-2 text-center sm:min-w-[210px]">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#71717A]">Statement</p>
              <h2 className="truncate text-base font-black text-black">{format(selectedMonth, 'MMMM yyyy')}</h2>
            </div>
            <button
              onClick={() => setSelectedMonth(prev => startOfMonth(addMonths(prev, 1)))}
              className="grid h-11 w-11 place-items-center rounded-xl border border-[#F0F0F0] text-black transition hover:border-[#0077FF] hover:text-[#0077FF]"
              aria-label="Next month"
            >
              <ChevronRight size={20} strokeWidth={1.7} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[#F0F0F0] bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#71717A]">Income</p>
              <p className="mt-2 text-lg font-black text-emerald-600">{formatCurrency(summary.totalIncome)}</p>
            </div>
            <div className="rounded-2xl border border-[#F0F0F0] bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#71717A]">Expense</p>
              <p className="mt-2 text-lg font-black text-rose-600">{formatCurrency(summary.totalExpense)}</p>
            </div>
            <div className="rounded-2xl border border-[#F0F0F0] bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#71717A]">Net</p>
              <p className="mt-2 text-lg font-black text-black">{formatCurrency(summary.netBalance)}</p>
            </div>
          </div>
        </div>
      </header>

      <Card className="grid grid-cols-1 gap-4 border border-[#F0F0F0] bg-white p-4 md:grid-cols-2 lg:grid-cols-4 md:p-5">
        <div className="relative space-y-1">
          <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#71717A]">Search by Description</label>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A1A1AA]" size={18} strokeWidth={1.7} />
          <input
            type="text"
            placeholder="Search by Description"
            className="w-full rounded-2xl border border-[#F0F0F0] bg-white py-3 pl-12 pr-4 text-sm font-bold text-black outline-none transition focus:border-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative space-y-1">
          <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#71717A]">Category</label>
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A1A1AA]" size={17} strokeWidth={1.7} />
          <select
            className="w-full appearance-none rounded-2xl border border-[#F0F0F0] bg-white py-3 pl-12 pr-4 text-sm font-bold text-black outline-none transition focus:border-black"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#71717A]">From Date</label>
          <input
            type="date"
            className="w-full rounded-2xl border border-[#F0F0F0] bg-white px-4 py-3 text-sm font-bold text-black outline-none transition focus:border-black"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#71717A]">To Date</label>
          <input
            type="date"
            className="w-full rounded-2xl border border-[#F0F0F0] bg-white px-4 py-3 text-sm font-bold text-black outline-none transition focus:border-black"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </Card>

      <section className="rounded-[28px] border border-[#F0F0F0] bg-white p-3 md:p-5">
        {loading ? (
          <div className="py-20 text-center text-sm font-black uppercase tracking-[0.2em] text-[#71717A]">
            Opening timeline...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#71717A]">No transactions</p>
            <p className="mt-2 text-sm font-bold text-[#71717A]">Try another month or search term.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([dateLabel, items]) => (
              <div key={dateLabel} className="space-y-2">
                <div className="sticky top-0 z-10 bg-white/95 py-2 backdrop-blur">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#71717A]">{dateLabel}</p>
                </div>

                <div className="space-y-2">
                  {items.map(transaction => {
                    const isCredit = Number(transaction.credit || 0) > 0;
                    const amount = isCredit ? Number(transaction.credit || 0) : Number(transaction.debit || 0);
                    return (
                      <div key={transaction.id} className="group flex items-center gap-3 rounded-2xl border border-[#F0F0F0] bg-white p-3 transition hover:border-[#D4D4D8]">
                        {isCredit ? (
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                            <ArrowDownLeft size={19} strokeWidth={1.7} />
                          </div>
                        ) : (
                          <CategoryIcon iconSlug={transaction.categories?.icon_slug} className="h-11 w-11 rounded-xl bg-[#111111] text-white" size={18} />
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-black">{transaction.description || transaction.categories?.name || 'Transaction'}</p>
                          <p className="mt-1 truncate text-[11px] font-bold uppercase tracking-tight text-[#71717A]">
                            {transaction.categories?.name || 'General'} / {transaction.subcategories?.name || 'Other'}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className={`text-sm font-black ${isCredit ? 'text-black' : 'text-rose-600'}`}>
                            {isCredit ? '+' : '-'}{formatCurrency(amount)}
                          </p>
                          <div className="mt-1 flex justify-end gap-1 opacity-40 transition group-hover:opacity-100">
                            <button
                              onClick={() => { onEdit(transaction); navigate('/form'); }}
                              className="grid h-8 w-8 place-items-center rounded-lg text-[#A1A1AA] transition hover:bg-[#F8F8F8] hover:text-black"
                              aria-label="Edit transaction"
                            >
                              <Edit3 size={15} strokeWidth={1.7} />
                            </button>
                            <button
                              onClick={() => handleDelete(transaction.id)}
                              className="grid h-8 w-8 place-items-center rounded-lg text-[#A1A1AA] transition hover:bg-rose-50 hover:text-rose-600"
                              aria-label="Delete transaction"
                            >
                              <Trash2 size={15} strokeWidth={1.7} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
