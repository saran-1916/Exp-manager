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
const sanitizePdfText = (value) => String(value ?? '').replace(/\u20b9/g, 'Rs.');

export default function TransactionsPage({ user, onEdit }) {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()));
  const [useCustomStatementRange, setUseCustomStatementRange] = useState(false);
  const [statementStartDate, setStatementStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [statementEndDate, setStatementEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const statementRange = useMemo(() => {
    const monthStart = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

    if (!useCustomStatementRange) {
      return { start: monthStart, end: monthEnd };
    }

    const start = statementStartDate || monthStart;
    const end = statementEndDate || start;

    return {
      start,
      end: end < start ? start : end
    };
  }, [selectedMonth, statementEndDate, statementStartDate, useCustomStatementRange]);

  const statementLabel = useMemo(() => {
    if (!useCustomStatementRange) {
      return format(selectedMonth, 'MMMM yyyy');
    }

    const fromLabel = format(parseISO(statementRange.start), 'dd MMM yyyy');
    const toLabel = format(parseISO(statementRange.end), 'dd MMM yyyy');

    return statementRange.start === statementRange.end ? fromLabel : `${fromLabel} to ${toLabel}`;
  }, [selectedMonth, statementRange.end, statementRange.start, useCustomStatementRange]);

  const fetchStatementTransactions = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('transactions')
      .select(`*, categories(name, type, icon_slug), subcategories(name)`)
      .eq('user_id', user.id)
      .gte('date', statementRange.start)
      .lte('date', statementRange.end)
      .order('date', { ascending: false });

    if (!error) setTransactions(data || []);
    setLoading(false);
  }, [statementRange.end, statementRange.start, user?.id]);

  useEffect(() => {
    fetchStatementTransactions();
  }, [fetchStatementTransactions]);

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
      const matchesStartDate = !filterStartDate || t.date >= filterStartDate;
      const matchesEndDate = !filterEndDate || t.date <= filterEndDate;

      return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate;
    });
  }, [transactions, searchTerm, selectedCategory, filterStartDate, filterEndDate]);

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
      if (!error) fetchStatementTransactions();
    }
  };

  const handleCustomStatementRangeChange = (checked) => {
    setUseCustomStatementRange(checked);

    if (checked) {
      setStatementStartDate(format(startOfMonth(selectedMonth), 'yyyy-MM-dd'));
      setStatementEndDate(format(endOfMonth(selectedMonth), 'yyyy-MM-dd'));
    }
  };

  const handleStatementStartDateChange = (value) => {
    setStatementStartDate(value);

    if (value && statementEndDate && statementEndDate < value) {
      setStatementEndDate(value);
    }
  };

  const handleStatementEndDateChange = (value) => {
    if (value && statementStartDate && value < statementStartDate) {
      setStatementEndDate(statementStartDate);
      return;
    }

    setStatementEndDate(value);
  };

  const handleFilterStartDateChange = (value) => {
    setFilterStartDate(value);

    if (value && filterEndDate && filterEndDate < value) {
      setFilterEndDate(value);
    }
  };

  const handleFilterEndDateChange = (value) => {
    if (value && filterStartDate && value < filterStartDate) {
      setFilterEndDate(filterStartDate);
      return;
    }

    setFilterEndDate(value);
  };

  const downloadStatement = () => {
    const doc = new jsPDF();
    const statementStart = statementRange.start;
    const statementEnd = statementRange.end;
    const fileName = `SPERA_STMT_${statementStart}_${statementEnd}.pdf`;

    doc.setFillColor(17, 17, 17);
    doc.rect(0, 0, 210, 42, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('SPERA', 16, 18);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(sanitizePdfText(`${statementLabel} Statement`), 16, 29);

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
      doc.text(sanitizePdfText(value), 194, y, { align: 'right' });
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
      doc.text(sanitizePdfText(t.description || t.categories?.name || 'Transaction'), 16, y);
      doc.text(sanitizePdfText(`${isCredit ? '+' : '-'} ${formatPdfCurrency(amount)}`), 194, y, { align: 'right' });
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(113, 113, 122);
      doc.text(sanitizePdfText(`${format(parseISO(t.date), 'dd MMM yyyy')}  |  ${t.categories?.name || 'General'} / ${t.subcategories?.name || 'Other'}`), 16, y);
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
            <p className="mt-2 text-sm font-bold text-[#71717A]">{statementLabel} statement view</p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <label className="flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#F0F0F0] bg-white px-4 text-sm font-black text-black transition hover:border-[#D4D4D8]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-black"
                checked={useCustomStatementRange}
                onChange={(e) => handleCustomStatementRangeChange(e.target.checked)}
              />
              Custom Range
            </label>

            <button
              onClick={downloadStatement}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-black text-white transition active:scale-[0.98] sm:flex-none"
            >
              <Download size={17} strokeWidth={1.7} />
              Download Statement
            </button>
          </div>
        </div>

        {/* Inline Summary Bar with Month Stepper and Overview Stats */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-3">
          {useCustomStatementRange ? (
            <div className="min-w-0 rounded-2xl border border-[#F0F0F0] bg-white p-3 lg:w-[420px] lg:shrink-0">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#71717A]">Statement Range</p>
              <div className="flex min-w-0 flex-row gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#71717A]">From</label>
                  <input
                    type="date"
                    className="h-11 w-full min-w-0 rounded-xl border border-[#F0F0F0] bg-white px-3 text-xs font-bold text-black outline-none transition focus:border-black sm:text-sm"
                    value={statementStartDate}
                    onChange={(e) => handleStatementStartDateChange(e.target.value)}
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#71717A]">To</label>
                  <input
                    type="date"
                    className="h-11 w-full min-w-0 rounded-xl border border-[#F0F0F0] bg-white px-3 text-xs font-bold text-black outline-none transition focus:border-black sm:text-sm"
                    value={statementEndDate}
                    min={statementStartDate || undefined}
                    onChange={(e) => handleStatementEndDateChange(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#F0F0F0] bg-white p-2 lg:w-fit lg:justify-start lg:shrink-0">
              <button
                onClick={() => setSelectedMonth(prev => startOfMonth(subMonths(prev, 1)))}
                className="grid h-11 w-11 place-items-center rounded-xl border border-[#F0F0F0] text-black transition hover:border-[#0077FF] hover:text-[#0077FF]"
                aria-label="Previous month"
              >
                <ChevronLeft size={20} strokeWidth={1.7} />
              </button>
              <div className="min-w-0 px-3 text-center lg:min-w-[160px]">
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
          )}

          {/* Overview Stats - Horizontal Row */}
          <div className="grid grid-cols-3 gap-3 lg:flex-1">
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
              <p className={`mt-2 text-lg font-black ${summary.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(summary.netBalance)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Section - Placed directly below Summary Bar */}
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
            value={filterStartDate}
            onChange={(e) => handleFilterStartDateChange(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#71717A]">To Date</label>
          <input
            type="date"
            className="w-full rounded-2xl border border-[#F0F0F0] bg-white px-4 py-3 text-sm font-bold text-black outline-none transition focus:border-black"
            value={filterEndDate}
            min={filterStartDate || undefined}
            onChange={(e) => handleFilterEndDateChange(e.target.value)}
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
