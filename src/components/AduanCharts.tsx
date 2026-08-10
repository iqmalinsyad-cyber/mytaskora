import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  CartesianGrid 
} from 'recharts';
import { ArrowUpRight } from 'lucide-react';

const TREND_DATA = [
  { month: 'Jan', actual: 42000, target: 38000 },
  { month: 'Feb', actual: 48000, target: 41000 },
  { month: 'Mar', actual: 51000, target: 44000 },
  { month: 'Apr', actual: 56000, target: 47000 },
  { month: 'May', actual: 61000, target: 50000 },
  { month: 'Jun', actual: 69000, target: 54000 },
  { month: 'Jul', actual: 78000, target: 59000 },
  { month: 'Aug', actual: 86000, target: 63000 },
  { month: 'Sep', actual: 94000, target: 68000 },
];

const DAILY_USAGE_DATA = [
  { day: 'Mon', requests: 1250 },
  { day: 'Tue', requests: 1680 },
  { day: 'Wed', requests: 1520 },
  { day: 'Thu', requests: 2040 },
  { day: 'Fri', requests: 2390 },
  { day: 'Sat', requests: 1810 },
  { day: 'Sun', requests: 1620 },
];

export const AduanCharts: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
      {/* Left 2 Cols: Trend Chart */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800 tracking-tight">
              Trend Aduan & Penyelesaian SLA
            </h4>
            <p className="text-[11px] text-slate-400 font-medium">
              Aduan Dibereskan vs Sasaran Target — 9 Bulan Terakhir
            </p>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            <ArrowUpRight className="w-3.5 h-3.5" />
            22% di atas sasaran
          </span>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(val) => `RM${val / 1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '12px' }}
                formatter={(val: any) => [`RM ${val.toLocaleString()}`, 'Jumlah']}
              />
              <Area type="monotone" dataKey="actual" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#actualGradient)" />
              <Area type="monotone" dataKey="target" stroke="#818cf8" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#targetGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Right 1 Col: Bar Chart */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
        {/* Header */}
        <div className="mb-4">
          <h4 className="text-sm font-bold text-slate-800 tracking-tight">
            Trafik Permohonan / Aduan Hari Ini
          </h4>
          <p className="text-[11px] text-slate-400 font-medium">
            Jumlah aduan awam masuk mengikut hari
          </p>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DAILY_USAGE_DATA} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '12px' }}
                formatter={(val: any) => [`${val} Transaksi`, 'Jumlah']}
              />
              <Bar dataKey="requests" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
