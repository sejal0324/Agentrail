import React from 'react';
import { ShieldCheck, Lock, Sliders, AlertTriangle } from 'lucide-react';

export const PolicyAdminView: React.FC = () => {
  const policies = [
    {
      label: 'Max Discount Limit',
      value: '25%',
      subtext: 'Calculated relative to public list price',
      icon: Sliders,
    },
    {
      label: 'Single Transaction Cap',
      value: '₹200,000',
      subtext: 'Maximum allowed total per order',
      icon: Lock,
    },
    {
      label: 'Session Order Cap',
      value: '3 orders / session',
      subtext: 'Velocity limit against runaway agents',
      icon: ShieldCheck,
    },
    {
      label: 'Session Spend Cap',
      value: '₹300,000',
      subtext: 'Cumulative maximum session spend',
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
              RailFence Policy Administration &amp; Guardrails
            </h3>
            <p className="text-[11px] text-slate-400">Active merchant-configured policy bounds</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-[11px] text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>POLICIES ACTIVE</span>
        </div>
      </div>

      {/* Grid of active policy rules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {policies.map((p, idx) => {
          const IconComp = p.icon;
          return (
            <div
              key={idx}
              className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-slate-400">{p.label}</span>
                <IconComp className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100 font-mono">{p.value}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{p.subtext}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Strict Floor Price Check Security Notice */}
      <div className="bg-slate-950/90 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <Lock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <span className="text-slate-300 text-[11px]">
            <strong className="text-slate-200">Strict Floor Price Validation:</strong> Enabled (Private merchant cost &amp; floor prices are evaluated server-side and never exposed over telemetry).
          </span>
        </div>
        <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono hidden sm:inline-block">
          ZERO-LEAKAGE BOUNDARY
        </span>
      </div>
    </div>
  );
};
