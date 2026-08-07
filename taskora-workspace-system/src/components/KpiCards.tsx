import React from 'react';
import { 
  DollarSign, 
  Users, 
  Sparkles, 
  Bot, 
  TrendingUp, 
  Smile, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { AduanCase } from '../types';

interface KpiCardsProps {
  cases: AduanCase[];
}

export const KpiCards: React.FC<KpiCardsProps> = ({ cases }) => {
  const totalCount = cases.length;
  const activeCount = cases.filter(c => c.status !== 'Selesai' && c.status !== 'Ditolak').length;
  const resolvedCount = cases.filter(c => c.status === 'Selesai').length;
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 88.7;

  const kpis = [
    {
      id: 'kpi-1',
      icon: DollarSign,
      iconBg: 'bg-indigo-50 text-indigo-600',
      value: 'RM 248,930',
      label: 'Kos Pembaikan',
      subtext: 'vs bulan lepas',
      change: '+18.2%',
      isPositive: true,
    },
    {
      id: 'kpi-2',
      icon: Users,
      iconBg: 'bg-indigo-50 text-indigo-600',
      value: '12,482',
      label: 'Pengadu Berdaftar',
      subtext: 'rolling 7 hari',
      change: '+9.4%',
      isPositive: true,
    },
    {
      id: 'kpi-3',
      icon: Sparkles,
      iconBg: 'bg-indigo-50 text-indigo-600',
      value: '1.84M',
      label: 'Log Semakan Sistem',
      subtext: 'bulan ini',
      change: '+24%',
      isPositive: true,
    },
    {
      id: 'kpi-4',
      icon: Bot,
      iconBg: 'bg-indigo-50 text-indigo-600',
      value: String(activeCount || 47),
      label: 'Kes Dalam Siasatan',
      subtext: 'merentas unit',
      change: '+6',
      isPositive: true,
    },
    {
      id: 'kpi-5',
      icon: TrendingUp,
      iconBg: 'bg-emerald-50 text-emerald-600',
      value: `${resolutionRate}%`,
      label: 'Kadar Penyelesaian SLA',
      subtext: 'MoM KPI',
      change: '+2.1pp',
      isPositive: true,
    },
    {
      id: 'kpi-6',
      icon: Smile,
      iconBg: 'bg-emerald-50 text-emerald-600',
      value: '94%',
      label: 'Skor CSAT Pengadu',
      subtext: 'daripada tinjauan',
      change: '-1.2%',
      isPositive: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            {/* Top row: Icon & Badge */}
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className={`flex items-center gap-0.5 text-[11px] font-bold ${
                kpi.isPositive ? 'text-emerald-600' : 'text-rose-500'
              }`}>
                {kpi.isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                <span>{kpi.change}</span>
              </div>
            </div>

            {/* Main Value & Labels */}
            <div>
              <div className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                {kpi.value}
              </div>
              <div className="text-xs font-semibold text-slate-800 mt-0.5">
                {kpi.label}
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                {kpi.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
