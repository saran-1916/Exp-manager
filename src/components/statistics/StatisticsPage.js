import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
  subYears
} from 'date-fns';
import { motion } from 'framer-motion';
import { BarChart3, ChevronLeft, ChevronRight, CircleSlash, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { CategoryIcon } from '../ui/CategoryIcon';
import { supabase } from '../../services/supabaseClient';

const CHART_COLORS = ['#2563EB', '#111111', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];
const ACCENT_COLOR = '#2563EB';
const AXIS_TICK = { fontSize: 11, fill: '#888888', fontWeight: 700, fontFamily: 'Inter, sans-serif' };

// Hook to detect if screen is mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

// Get responsive tick styling
const getResponsiveTickStyle = (isMobile) => ({
  fontSize: isMobile ? 10 : 11,
  fill: '#888888',
  fontWeight: 700,
  fontFamily: 'Inter, sans-serif',
  angle: 0,
  textAnchor: 'middle'
});

const amountFormat = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0
});

const formatAmount = (value) => `Rs. ${amountFormat.format(Number(value || 0))}`;

const periodConfig = {
  day: {
    label: 'Day',
    start: startOfMonth,
    end: endOfMonth,
    add: addMonths,
    sub: subMonths,
    title: (date) => format(date, 'MMMM yyyy'),
    previousLabel: 'Previous month'
  },
  week: {
    label: 'Week',
    start: startOfMonth,
    end: endOfMonth,
    add: addMonths,
    sub: subMonths,
    title: (date) => format(date, 'MMMM yyyy'),
    previousLabel: 'Previous month'
  },
  year: {
    label: 'Year',
    start: startOfYear,
    end: endOfYear,
    add: addYears,
    sub: subYears,
    title: (date) => format(date, 'yyyy'),
    previousLabel: 'Previous year'
  }
};

const getPeriodRange = (mode, date) => {
  const config = periodConfig[mode];
  return {
    start: config.start(date),
    end: config.end(date)
  };
};

const toDateKey = (date) => format(date, 'yyyy-MM-dd');

const makeSpendingBuckets = (mode, periodStart, periodEnd) => {
  if (mode === 'day') {
    return eachDayOfInterval({ start: periodStart, end: periodEnd }).map(day => ({
      name: format(day, 'd'),
      dateLabel: format(day, 'dd MMM yyyy'),
      startKey: toDateKey(day),
      endKey: toDateKey(day),
      expense: 0
    }));
  }

  if (mode === 'week') {
    const buckets = [];
    let cursor = startOfWeek(periodStart, { weekStartsOn: 1 });
    let index = 1;

    while (cursor <= periodEnd) {
      const weekStart = cursor < periodStart ? periodStart : cursor;
      const weekEnd = endOfWeek(cursor, { weekStartsOn: 1 }) > periodEnd ? periodEnd : endOfWeek(cursor, { weekStartsOn: 1 });

      buckets.push({
        name: `W${index}`,
        dateLabel: `${format(weekStart, 'dd MMM')} - ${format(weekEnd, 'dd MMM yyyy')}`,
        startKey: toDateKey(weekStart),
        endKey: toDateKey(weekEnd),
        expense: 0
      });

      cursor = addWeeks(cursor, 1);
      index += 1;
    }

    return buckets;
  }

  if (mode === 'year') {
    return eachMonthOfInterval({ start: periodStart, end: periodEnd }).map(month => ({
      name: format(month, 'MMM'),
      dateLabel: format(month, 'MMMM yyyy'),
      startKey: toDateKey(startOfMonth(month)),
      endKey: toDateKey(endOfMonth(month)),
      expense: 0
    }));
  }

  return [];
};

const NoDataState = ({ label = 'No Transactions Found' }) => (
  <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#F0F0F0] bg-white px-6 text-center">
    <CircleSlash size={34} strokeWidth={1.6} className="text-[#A1A1AA]" />
    <p className="mt-4 text-sm font-black uppercase tracking-[0.22em] text-[#71717A]">{label}</p>
    <p className="mt-2 text-sm font-bold text-[#71717A]">Try another period from the stepper.</p>
  </div>
);

const SpendingTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-xl border border-[#F0F0F0] bg-white px-4 py-3 text-xs shadow-none">
      <p className="font-bold text-[#71717A]">Date: {item.dateLabel}</p>
      <p className="mt-1 font-black text-black">Amount: {formatAmount(payload[0].value)}</p>
    </div>
  );
};

const CategoryTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-xl border border-[#F0F0F0] bg-white px-4 py-3 text-xs shadow-none">
      <p className="font-bold text-[#71717A]">Category: {item.name}</p>
      <p className="mt-1 font-black text-black">Amount: {formatAmount(payload[0].value)}</p>
    </div>
  );
};

export default function StatisticsPage({ user }) {
  const [periodMode, setPeriodMode] = useState('day');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [currentTransactions, setCurrentTransactions] = useState([]);
  const [previousTransactions, setPreviousTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  const activeConfig = periodConfig[periodMode];
  const currentRange = useMemo(() => getPeriodRange(periodMode, anchorDate), [periodMode, anchorDate]);
  const previousAnchor = useMemo(() => activeConfig.sub(anchorDate, 1), [activeConfig, anchorDate]);
  const previousRange = useMemo(() => getPeriodRange(periodMode, previousAnchor), [periodMode, previousAnchor]);

  const fetchPeriodTransactions = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select(`*, categories(name, type, icon_slug), subcategories(name)`)
      .eq('user_id', user.id)
      .gte('date', format(previousRange.start, 'yyyy-MM-dd'))
      .lte('date', format(currentRange.end, 'yyyy-MM-dd'))
      .order('date', { ascending: true });

    if (!error) {
      const records = data || [];
      setCurrentTransactions(records.filter(t => t.date >= format(currentRange.start, 'yyyy-MM-dd') && t.date <= format(currentRange.end, 'yyyy-MM-dd')));
      setPreviousTransactions(records.filter(t => t.date >= format(previousRange.start, 'yyyy-MM-dd') && t.date <= format(previousRange.end, 'yyyy-MM-dd')));
    }

    setLoading(false);
  }, [currentRange, previousRange, user?.id]);

  useEffect(() => {
    fetchPeriodTransactions();
  }, [fetchPeriodTransactions]);

  const totals = useMemo(() => {
    const currentExpense = currentTransactions.reduce((sum, t) => sum + Number(t.debit || 0), 0);
    const currentIncome = currentTransactions.reduce((sum, t) => sum + Number(t.credit || 0), 0);
    const previousExpense = previousTransactions.reduce((sum, t) => sum + Number(t.debit || 0), 0);

    return {
      currentExpense,
      currentIncome,
      previousExpense,
      net: currentIncome - currentExpense
    };
  }, [currentTransactions, previousTransactions]);

  const spendingData = useMemo(() => {
    const buckets = makeSpendingBuckets(periodMode, currentRange.start, currentRange.end);

    return buckets.map(bucket => {
      const bucketExpense = currentTransactions
        .filter(t => t.date >= bucket.startKey && t.date <= bucket.endKey)
        .reduce((sum, t) => sum + Number(t.debit || 0), 0);

      return {
        ...bucket,
        expense: bucketExpense
      };
    });
  }, [currentRange, currentTransactions, periodMode]);

  const donutData = useMemo(() => {
    const grouped = currentTransactions.reduce((acc, t) => {
      if (Number(t.debit || 0) <= 0) return acc;
      const name = t.categories?.name || 'Other';
      if (!acc[name]) acc[name] = { name, value: 0, iconSlug: t.categories?.icon_slug };
      acc[name].value += Number(t.debit || 0);
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.value - a.value);
  }, [currentTransactions]);

  const topSpendersData = useMemo(() => donutData.slice(0, 5), [donutData]);
  const spendingChartWidth = useMemo(() => {
    const labelWidth = periodMode === 'day' ? 46 : periodMode === 'week' ? 84 : 72;
    return Math.max(560, spendingData.length * labelWidth + 104);
  }, [periodMode, spendingData.length]);

  const hasData = currentTransactions.length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-6 bg-white pb-24 font-sans text-black">
      <header className="space-y-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#71717A]">Premium insights</p>
          <h1 className="mt-2 truncate text-3xl font-black tracking-tight text-black md:text-4xl">Statistics</h1>
          <p className="mt-2 truncate text-sm font-bold text-[#71717A]">{activeConfig.title(anchorDate)}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="mx-auto grid w-full max-w-xl grid-cols-3 items-center justify-center gap-1 rounded-2xl border border-[#F0F0F0] bg-white p-1">
            {Object.entries(periodConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setPeriodMode(key)}
                className={`min-w-0 rounded-xl px-3 py-3 text-center text-xs font-black uppercase tracking-[0.18em] transition ${periodMode === key ? 'bg-black text-white' : 'text-[#71717A]'}`}
              >
                {config.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#F0F0F0] bg-white p-2 sm:w-fit sm:justify-start">
            <button
              onClick={() => setAnchorDate(prev => activeConfig.sub(prev, 1))}
              className="grid h-11 w-11 place-items-center rounded-xl border border-[#F0F0F0] text-black transition hover:border-[#0077FF] hover:text-[#0077FF]"
              aria-label="Previous period"
            >
              <ChevronLeft size={20} strokeWidth={1.7} />
            </button>
            <div className="min-w-0 px-2 text-center sm:min-w-[240px]">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#71717A]">{activeConfig.label}</p>
              <h2 className="truncate text-base font-black text-black">{activeConfig.title(anchorDate)}</h2>
            </div>
            <button
              onClick={() => setAnchorDate(prev => activeConfig.add(prev, 1))}
              className="grid h-11 w-11 place-items-center rounded-xl border border-[#F0F0F0] text-black transition hover:border-[#0077FF] hover:text-[#0077FF]"
              aria-label="Next period"
            >
              <ChevronRight size={20} strokeWidth={1.7} />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border border-[#F0F0F0] bg-white p-6">
          <p className="spera-card-text font-black uppercase tracking-[0.2em] text-[#71717A]">Spent</p>
          <p className="spera-truncate mt-3 text-2xl font-black text-black">{formatAmount(totals.currentExpense)}</p>
        </Card>
        <Card className="border border-[#F0F0F0] bg-white p-6">
          <p className="spera-card-text font-black uppercase tracking-[0.2em] text-[#71717A]">Income</p>
          <p className="spera-truncate mt-3 text-2xl font-black text-emerald-600">{formatAmount(totals.currentIncome)}</p>
        </Card>
        <Card className="border border-[#F0F0F0] bg-white p-6">
          <p className="spera-card-text font-black uppercase tracking-[0.2em] text-[#71717A]">Net</p>
          <p className="spera-truncate mt-3 text-2xl font-black text-black">{formatAmount(totals.net)}</p>
        </Card>
      </div>

      <Card className="border border-[#F0F0F0] bg-white p-6 md:p-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#71717A]">Main chart</p>
            <h3 className="mt-1 truncate text-2xl font-black tracking-tight text-black">Discrete spending</h3>
          </div>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#EAF4FF] text-[#2563EB]">
            <TrendingUp size={20} strokeWidth={1.7} />
          </div>
        </div>

        {loading ? (
          <NoDataState label="Loading Insights" />
        ) : !hasData ? (
          <NoDataState />
        ) : (
          <div className="w-full overflow-x-auto overflow-y-hidden rounded-lg pb-2">
            <div className="h-[360px]" style={{ width: `${spendingChartWidth}px`, minWidth: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={spendingData} 
                  barCategoryGap={isMobile ? "34%" : "42%"}
                  margin={{ 
                    left: 0, 
                    right: 8, 
                    top: 0, 
                    bottom: 28 
                  }}
                >
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={getResponsiveTickStyle(isMobile)}
                    interval={0}
                    height={48}
                    tickMargin={12}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={AXIS_TICK} 
                    tickFormatter={(value) => `Rs. ${amountFormat.format(value)}`} 
                    width={72} 
                  />
                  <Tooltip cursor={{ fill: '#FAFAFA' }} content={<SpendingTooltip />} />
                  <Bar dataKey="expense" fill={ACCENT_COLOR} radius={[4, 4, 0, 0]} barSize={isMobile ? 14 : 18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="relative border border-[#F0F0F0] bg-white p-6 md:p-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#71717A]">Breakdown</p>
              <h3 className="mt-1 truncate text-2xl font-black tracking-tight text-black">Category donut</h3>
            </div>
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#F8F8F8] text-black">
              <PieChartIcon size={20} strokeWidth={1.7} />
            </div>
          </div>

          {!hasData || donutData.length === 0 ? (
            <NoDataState />
          ) : (
            <>
              <div className="relative h-[310px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} innerRadius={88} outerRadius={118} paddingAngle={6} dataKey="value" stroke="none">
                      {donutData.map((_, index) => <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatAmount(value)} contentStyle={{ border: '1px solid #F0F0F0', borderRadius: 16, boxShadow: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#71717A]">Total</p>
                  <p className="mt-2 text-2xl font-black text-black">{formatAmount(totals.currentExpense)}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {donutData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2 rounded-full border border-[#F0F0F0] bg-white px-3 py-1.5">
                    <CategoryIcon iconSlug={item.iconSlug} className="h-7 w-7 shrink-0 rounded-lg bg-[#111111] text-white" size={13} />
                    <span className="min-w-0 truncate text-[10px] font-black uppercase tracking-tight text-[#71717A]">{item.name}</span>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card className="border border-[#F0F0F0] bg-white p-6 md:p-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#71717A]">Top spenders</p>
              <h3 className="mt-1 truncate text-2xl font-black tracking-tight text-black">Top 5 Categories</h3>
            </div>
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#F8F8F8] text-black">
              <BarChart3 size={20} strokeWidth={1.7} />
            </div>
          </div>

          {!hasData || topSpendersData.length === 0 ? (
            <NoDataState />
          ) : (
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSpendersData} layout="vertical" margin={{ left: 20, right: 24 }}>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={AXIS_TICK} tickFormatter={(value) => `Rs. ${amountFormat.format(value)}`} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={AXIS_TICK} width={120} />
                  <Tooltip cursor={{ fill: '#FAFAFA' }} content={<CategoryTooltip />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                    {topSpendersData.map((_, index) => <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  );
}
