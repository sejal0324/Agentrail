import React from 'react';
import { TelemetryMetrics } from '../types/telemetry';
import { TrendingUp, DollarSign, Activity, CreditCard, Clock } from 'lucide-react';

interface MetricsOverviewProps {
  metrics: TelemetryMetrics | null;
  loading: boolean;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics, loading }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const aov = metrics?.aov ?? 0;
  const upliftAmount = metrics?.growthUplift.absoluteAmount ?? 0;
  const upliftPercent = metrics?.growthUplift.percentage ?? 0;
  const totalActions = metrics?.totalAgentActions ?? 0;
  const razorpayCalls = metrics?.razorpayCallsCount ?? 0;
  const avgTime = metrics?.averageTimeToAgreementMs ?? 0;

  const cards = [
    {
      title: 'Average Order Value (AOV)',
      value: loading ? '...' : formatCurrency(aov),
      subtext: 'Across approved proposals',
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      title: 'Growth Uplift',
      value: loading ? '...' : `${upliftAmount >= 0 ? '+' : ''}${formatCurrency(upliftAmount)}`,
      badge: loading ? null : `${upliftPercent >= 0 ? '+' : ''}${upliftPercent}%`,
      subtext: 'Incremental transaction value generated via agent growth actions',
      icon: TrendingUp,
      color: upliftAmount > 0 ? 'text-emerald-400' : 'text-slate-400',
      bg: upliftAmount > 0 ? 'bg-emerald-500/10' : 'bg-slate-800',
      borderColor: upliftAmount > 0 ? 'border-emerald-500/20' : 'border-slate-700/50',
    },
    {
      title: 'Total Agent Actions',
      value: loading ? '...' : totalActions.toLocaleString(),
      subtext: 'Evaluated proposals',
      icon: Activity,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'Razorpay SDK Calls',
      value: loading ? '...' : razorpayCalls.toLocaleString(),
      subtext: 'Executed orders',
      icon: CreditCard,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
    },
    {
      title: 'Avg Time to Agreement',
      value: loading ? '...' : `${avgTime.toLocaleString()} ms`,
      subtext: 'Negotiation duration',
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`bg-[#0f172a] border ${card.borderColor} rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group`}
          >
            <div className={`absolute -inset-1 opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-xl ${card.bg.replace('/10', '')}`} />

            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-xs font-semibold tracking-wide uppercase text-slate-400">{card.title}</span>
              <div className={`p-2 rounded-xl bg-slate-900/50 border ${card.borderColor} shadow-inner`}>
                <IconComponent className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>

            <div className="relative z-10">
              {card.title === 'Growth Uplift' ? (
                <div className="flex items-baseline space-x-1.5 min-w-0 w-full">
                  <div className="flex items-baseline whitespace-nowrap shrink-0 text-xl font-black text-slate-100 tracking-tight">
                    {loading ? (
                      <span>...</span>
                    ) : (
                      <>
                        <span className="shrink-0">{upliftAmount >= 0 ? '+' : ''}</span>
                        <span className="shrink-0 ml-1">{formatCurrency(upliftAmount)}</span>
                      </>
                    )}
                  </div>
                  {card.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.bg} ${card.color} ${card.borderColor} shadow-sm shrink-0`}>
                      {card.badge}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-slate-100 tracking-tight">{card.value}</span>
                  {card.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.bg} ${card.color} ${card.borderColor} shadow-sm`}>
                      {card.badge}
                    </span>
                  )}
                </div>
              )}
              <p className="text-[11px] text-slate-500 mt-1 font-medium">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
