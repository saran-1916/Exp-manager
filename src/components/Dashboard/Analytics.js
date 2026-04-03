import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Analytics({ transactions = [] }) {
  // Group data by category name
  const data = transactions.reduce((acc, curr) => {
    if (curr.debit > 0) {
      const name = curr.categories?.name || 'Uncategorized';
      const existing = acc.find(item => item.name === name);
      if (existing) {
        existing.value += Number(curr.debit);
      } else {
        acc.push({ name, value: Number(curr.debit) });
      }
    }
    return acc;
  }, []);

  if (data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-400">No expense data yet</div>;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
          />
          <Legend iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}