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
      subtext: 'Revenue expansion vs base',
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
            className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-md"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-slate-400">{card.title}</span>
              <div className={`p-1.5 rounded-lg ${card.bg} ${card.borderColor} border`}>
                <IconComponent className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>

            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-lg font-bold text-slate-100">{card.value}</span>
                {card.badge && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${card.bg} ${card.color} ${card.borderColor}`}>
                    {card.badge}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
