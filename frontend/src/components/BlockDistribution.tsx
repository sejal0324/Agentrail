import React from 'react';
import { CategorizedBlockCounts } from '../types/telemetry';
import { ShieldAlert, CheckCircle2, AlertOctagon } from 'lucide-react';

interface BlockDistributionProps {
  blockCounts: CategorizedBlockCounts | undefined;
  loading: boolean;
}

interface CategoryConfig {
  key: string;
  label: string;
  description: string;
  colorClass: string;
  barClass: string;
}

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  FLOOR_PRICE_VIOLATION: {
    key: 'FLOOR_PRICE_VIOLATION',
    label: 'Floor Price Violation',
    description: 'Proposed price below merchant floor price',
    colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    barClass: 'bg-rose-500',
  },
  DISCOUNT_LIMIT_EXCEEDED: {
    key: 'DISCOUNT_LIMIT_EXCEEDED',
    label: 'Discount Limit Exceeded',
    description: 'Discount exceeded max threshold (25%)',
    colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    barClass: 'bg-amber-500',
  },
  VELOCITY_LIMIT_EXCEEDED: {
    key: 'VELOCITY_LIMIT_EXCEEDED',
    label: 'Velocity Limit Exceeded',
    description: 'Session order or cumulative spend cap reached',
    colorClass: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    barClass: 'bg-orange-500',
  },
  SCHEMA_VIOLATION: {
    key: 'SCHEMA_VIOLATION',
    label: 'Schema Violation',
    description: 'Invalid proposal JSON payload structure',
    colorClass: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    barClass: 'bg-purple-500',
  },
  UNKNOWN_SKU: {
    key: 'UNKNOWN_SKU',
    label: 'Unknown SKU',
    description: 'Requested SKU not found in active catalog',
    colorClass: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    barClass: 'bg-blue-500',
  },
  RECALCULATION_MISMATCH: {
    key: 'RECALCULATION_MISMATCH',
    label: 'Recalculation Mismatch',
    description: 'Proposed total mismatch with item subtotal sum',
    colorClass: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
    barClass: 'bg-pink-500',
  },
};

export const BlockDistribution: React.FC<BlockDistributionProps> = ({ blockCounts, loading }) => {
  const counts = blockCounts || {
    FLOOR_PRICE_VIOLATION: 0,
    DISCOUNT_LIMIT_EXCEEDED: 0,
    VELOCITY_LIMIT_EXCEEDED: 0,
    SCHEMA_VIOLATION: 0,
    UNKNOWN_SKU: 0,
    RECALCULATION_MISMATCH: 0,
  };

  const totalBlocks = Object.values(counts).reduce((acc, curr) => acc + curr, 0);

  // Combine standard keys and any dynamic keys present in metrics
  const allKeys = Array.from(
    new Set([...Object.keys(CATEGORY_MAP), ...Object.keys(counts)])
  );

  const maxCount = Math.max(...Object.values(counts), 1);

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/20 blur-3xl rounded-full -z-10 pointer-events-none"></div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-inner">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest">
              RailFence Policy Block Distribution
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Categorized policy enforcement metrics</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Blocks:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-black border shadow-sm ${
              totalBlocks > 0
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-rose-900/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-900/20'
            }`}
          >
            {loading ? '...' : totalBlocks}
          </span>
        </div>
      </div>

      {totalBlocks === 0 && !loading ? (
        <div className="py-5 px-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs text-emerald-300 shadow-inner">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-medium tracking-wide">All Guardrails Operational — Zero Policy Violations Recorded</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono font-bold tracking-widest bg-emerald-900/40 px-2 py-1 rounded">STATUS: OPTIMAL</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allKeys.map((key) => {
            const count = counts[key] || 0;
            const config = CATEGORY_MAP[key] || {
              key,
              label: key.replace(/_/g, ' '),
              description: 'Custom policy violation',
              colorClass: 'text-slate-300 bg-slate-800 border-slate-700',
              barClass: 'bg-slate-500',
            };
            const percentage = Math.min(100, Math.round((count / maxCount) * 100));

            return (
              <div
                key={key}
                className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:bg-slate-800/40 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-200 tracking-wide">{config.label}</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">{config.description}</p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border shadow-sm ${
                      count > 0 ? config.colorClass : 'text-slate-500 bg-slate-900 border-slate-800'
                    }`}
                  >
                    {loading ? '...' : count}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-950/80 h-2 rounded-full overflow-hidden border border-slate-800/50 shadow-inner">
                  <div
                    className={`h-full ${config.barClass} transition-all duration-700 rounded-full group-hover:brightness-110`}
                    style={{ width: `${count > 0 ? Math.max(8, percentage) : 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
