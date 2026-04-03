import React, { useState, useMemo } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { Card } from '../ui/Card';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { 
  format, startOfDay, startOfWeek, startOfMonth, endOfMonth,
  addDays, addWeeks, addMonths, isBefore, parseISO, eachDayOfInterval,
  endOfDay, endOfWeek, isWithinInterval
} from 'date-fns';
import { LayoutGrid, Activity, BarChart3, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b', '#06b6d4'];

export default function StatisticsPage({ user }) {
  const staticDate = useMemo(() => new Date(), []);
  const { allTransactions, loading } = useTransactions(user?.id, staticDate);
  
  const [timeGrain, setTimeGrain] = useState('monthly');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [viewMode, setViewMode] = useState('all'); 
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const availableMonths = useMemo(() => {
    const months = allTransactions.map(t => t.date.slice(0, 7));
    return [...new Set(months)].sort().reverse();
  }, [allTransactions]);

  const categoriesList = useMemo(() => {
    const names = allTransactions.map(t => t.categories?.name).filter(Boolean);
    return ['All Categories', ...new Set(names)];
  }, [allTransactions]);

  // --- CORE ANALYTICS ENGINE ---
  const { trendData, pieData, story, activePeriodLabel } = useMemo(() => {
    if (loading || !allTransactions.length) {
      return { trendData: [], pieData: [], story: "Waiting for data...", activePeriodLabel: '' };
    }

    const filteredByCat = selectedCategory === 'All Categories'
      ? allTransactions
      : allTransactions.filter(t => t.categories?.name === selectedCategory);

    let timeline = [];
    let pieTargetInterval = { start: new Date(), end: new Date() };

    // 1. DETERMINE TIME WINDOWS
    if (viewMode === 'drilldown') {
      const targetStart = startOfMonth(parseISO(`${selectedMonth}-01`));
      const targetEnd = endOfMonth(targetStart);
      pieTargetInterval = { start: targetStart, end: targetEnd };

      const days = eachDayOfInterval({ start: targetStart, end: targetEnd });
      timeline = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayData = filteredByCat.filter(t => t.date === dayStr);
        return {
          name: format(day, 'dd MMM'),
          income: dayData.reduce((sum, t) => sum + Number(t.credit || 0), 0),
          expense: dayData.reduce((sum, t) => sum + Number(t.debit || 0), 0),
        };
      });
    } else {
      // OVERVIEW MODE: Logic for dynamic Pie Chart window based on grain
      const now = new Date();
      if (timeGrain === 'daily') {
        pieTargetInterval = { start: startOfDay(now), end: endOfDay(now) };
      } else if (timeGrain === 'weekly') {
        pieTargetInterval = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      } else {
        pieTargetInterval = { start: startOfMonth(now), end: endOfMonth(now) };
      }

      const sorted = [...allTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));
      const firstDate = parseISO(sorted[0].date);
      let cursor = timeGrain === 'daily' ? startOfDay(firstDate) : timeGrain === 'weekly' ? startOfWeek(firstDate, { weekStartsOn: 1 }) : startOfMonth(firstDate);

      while (isBefore(cursor, now) || format(cursor, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) {
        const key = format(cursor, 'yyyy-MM-dd');
        const periodData = filteredByCat.filter(t => {
            const d = parseISO(t.date);
            if (timeGrain === 'daily') return format(d, 'yyyy-MM-dd') === key;
            if (timeGrain === 'weekly') return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd') === key;
            return format(startOfMonth(d), 'yyyy-MM-dd') === key;
        });

        timeline.push({
          name: timeGrain === 'daily' ? format(cursor, 'MMM d') : timeGrain === 'weekly' ? `W${format(cursor, 'w')}` : format(cursor, 'MMM yy'),
          income: periodData.reduce((sum, t) => sum + Number(t.credit || 0), 0),
          expense: periodData.reduce((sum, t) => sum + Number(t.debit || 0), 0),
        });
        cursor = timeGrain === 'daily' ? addDays(cursor, 1) : timeGrain === 'weekly' ? addWeeks(cursor, 1) : addMonths(cursor, 1);
      }
    }

    // 2. DYNAMIC PIE CALCULATION (Filtered by timeGrain window)
    const pieFilteredTransactions = allTransactions.filter(t => {
        const tDate = parseISO(t.date);
        return isWithinInterval(tDate, pieTargetInterval) && Number(t.debit) > 0;
    });

    const pieMap = pieFilteredTransactions.reduce((acc, t) => {
      if (selectedCategory === 'All Categories') {
        const name = t.categories?.name || 'Other';
        acc[name] = (acc[name] || 0) + Number(t.debit);
      } else if (t.categories?.name === selectedCategory) {
        const name = t.subcategories?.name || 'General';
        acc[name] = (acc[name] || 0) + Number(t.debit);
      }
      return acc;
    }, {});
    const pieFormatted = Object.entries(pieMap).map(([name, value]) => ({ name, value }));

    // 3. NARRATIVE
    const currentTotal = timeline.reduce((sum, i) => sum + i.expense, 0);
    const storyTxt = viewMode === 'drilldown' 
        ? `In ${format(parseISO(`${selectedMonth}-01`), 'MMMM')}, your total spending recorded is ₹${currentTotal.toLocaleString()}.`
        : `Historical spending across this view totals ₹${currentTotal.toLocaleString()}.`;

    return { 
      trendData: timeline, 
      pieData: pieFormatted, 
      story: storyTxt, 
      activePeriodLabel: viewMode === 'drilldown' ? format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy') : 'Full Records'
    };
  }, [allTransactions, timeGrain, selectedCategory, loading, viewMode, selectedMonth]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-slate-900 text-2xl animate-pulse italic uppercase">Updating Insights...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-8 pb-20 px-4 font-sans text-slate-900">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Insights & Analytics</h1>
        <p className="text-slate-500 font-medium text-sm mt-1 italic uppercase tracking-tighter tracking-widest">{activePeriodLabel}</p>
      </header>

      {/* --- Filter System --- */}
      <Card className="border border-slate-200 bg-white p-6 shadow-sm rounded-3xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button onClick={() => setViewMode('all')} className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500'}`}>Overview</button>
            <button onClick={() => setViewMode('drilldown')} className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'drilldown' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500'}`}>Drilldown</button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 lg:col-span-2">
            {viewMode === 'drilldown' ? (
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-slate-800 cursor-pointer" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  {availableMonths.map(m => <option key={m} value={m}>{format(parseISO(`${m}-01`), 'MMMM yyyy')}</option>)}
                </select>
              </div>
            ) : (
              <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200 flex-1">
                {['daily', 'weekly', 'monthly'].map(g => (
                  <button key={g} onClick={() => setTimeGrain(g)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${timeGrain === g ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>{g}</button>
                ))}
              </div>
            )}
            <div className="relative flex-1">
              <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-slate-800 cursor-pointer" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* distribution Card */}
        <Card className="border border-slate-200 p-8 flex flex-col items-center rounded-3xl bg-white min-h-[450px]">
          <div className="flex items-center gap-3 self-start mb-10">
              <div className="p-2 bg-violet-50 rounded-lg text-violet-600"><BarChart3 size={20}/></div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                {viewMode === 'all' ? `${timeGrain} distribution` : 'Monthly distribution'}
              </h3>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={pieData} innerRadius={85} outerRadius={110} paddingAngle={10} dataKey="value" stroke="none">
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }} formatter={(v) => `₹${v.toLocaleString()}`} />
                <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="flex-1 flex items-center text-slate-300 font-bold italic text-sm text-center px-10">No data found for this specific {timeGrain} window.</div>}
        </Card>

        {/* Narrative Card */}
        <Card className="border border-slate-200 p-12 flex flex-col justify-center relative overflow-hidden bg-indigo-50/30 rounded-3xl">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-indigo-900 pointer-events-none"><Activity size={180}/></div>
          <h3 className="text-[10px] font-black text-indigo-600 uppercase mb-8 tracking-[0.3em] flex items-center gap-2">Performance Narrative</h3>
          <p className="text-3xl font-bold leading-tight italic mb-10 text-slate-900 leading-snug">"{story}"</p>
          <div className="flex items-center gap-6">
             <div className="p-5 rounded-3xl bg-white border border-indigo-100 text-indigo-600 shadow-sm"><Activity size={32}/></div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <p className="text-xl font-black uppercase text-indigo-600 italic tracking-tighter">Activity Synced</p>
             </div>
          </div>
        </Card>
      </div>

      {/* Area Chart */}
      <Card className="border border-slate-200 p-10 shadow-sm rounded-[2rem] bg-white">
        <h3 className="text-xs font-black text-slate-400 uppercase mb-10 tracking-widest">Spending Intensity Map</h3>
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 800}} dy={15} interval={viewMode === 'drilldown' ? 2 : (timeGrain === 'daily' ? 12 : 0)} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 800}} tickFormatter={(v) => `₹${v}`} />
              <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} formatter={(v) => `₹${v.toLocaleString()}`} />
              <Area type="monotone" dataKey="expense" stroke="#6366f1" strokeWidth={5} fill="url(#colorArea)" animationDuration={1000} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Bar Chart (CASH FLOW) */}
      <Card className="border border-slate-200 p-10 shadow-sm rounded-[2rem] bg-white">
        <div className="flex items-center justify-between mb-10">
           <div className="flex items-center gap-3"><div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Activity size={20}/></div><h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Cash Flow Analysis</h3></div>
           <div className="flex gap-6">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"/><span className="text-[10px] font-bold text-slate-400 uppercase">Inflow</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"/><span className="text-[10px] font-bold text-slate-400 uppercase">Outflow</span></div>
           </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 800}} dy={15} interval={viewMode === 'drilldown' ? 2 : (timeGrain === 'daily' ? 12 : 0)} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 800}} tickFormatter={(v) => `₹${v}`} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '15px' }} formatter={(v) => `₹${v.toLocaleString()}`} />
              <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} barSize={viewMode === 'drilldown' ? 6 : (timeGrain === 'daily' ? 4 : 20)} />
              <Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={viewMode === 'drilldown' ? 6 : (timeGrain === 'daily' ? 4 : 20)} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}