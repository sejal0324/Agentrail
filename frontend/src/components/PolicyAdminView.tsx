import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Sliders, AlertTriangle, Edit3, Check, RefreshCw } from 'lucide-react';

interface PolicyConfig {
  maxDiscountPercent: number;
  maxTransactionAmount: number;
  maxOrdersPerSession: number;
  maxSpendPerSession: number;
  strictFloorPriceCheck: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const PolicyAdminView: React.FC = () => {
  const [policy, setPolicy] = useState<PolicyConfig>({
    maxDiscountPercent: 25,
    maxTransactionAmount: 200000,
    maxOrdersPerSession: 3,
    maxSpendPerSession: 300000,
    strictFloorPriceCheck: true,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states for editing
  const [discountPercent, setDiscountPercent] = useState<number>(25);
  const [txAmount, setTxAmount] = useState<number>(200000);
  const [ordersPerSession, setOrdersPerSession] = useState<number>(3);
  const [spendPerSession, setSpendPerSession] = useState<number>(300000);

  const fetchPolicy = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/policy`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.policy) {
          setPolicy(data.policy);
          setDiscountPercent(data.policy.maxDiscountPercent);
          setTxAmount(data.policy.maxTransactionAmount);
          setOrdersPerSession(data.policy.maxOrdersPerSession);
          setSpendPerSession(data.policy.maxSpendPerSession);
        }
      }
    } catch (err) {
      console.error('Failed to fetch policy:', err);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/policy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxDiscountPercent: Number(discountPercent),
          maxTransactionAmount: Number(txAmount),
          maxOrdersPerSession: Number(ordersPerSession),
          maxSpendPerSession: Number(spendPerSession),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.policy) {
          setPolicy(data.policy);
          setSaveSuccess(true);
          setIsEditing(false);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      }
    } catch (err) {
      console.error('Failed to update policy:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const policyDisplayItems = [
    {
      label: 'Max Discount Limit',
      value: `${policy.maxDiscountPercent}%`,
      subtext: 'Calculated relative to public list price',
      icon: Sliders,
    },
    {
      label: 'Single Transaction Cap',
      value: `₹${policy.maxTransactionAmount.toLocaleString('en-IN')}`,
      subtext: 'Maximum allowed total per order',
      icon: Lock,
    },
    {
      label: 'Session Order Cap',
      value: `${policy.maxOrdersPerSession} orders / session`,
      subtext: 'Velocity limit against runaway agents',
      icon: ShieldCheck,
    },
    {
      label: 'Session Spend Cap',
      value: `₹${policy.maxSpendPerSession.toLocaleString('en-IN')}`,
      subtext: 'Cumulative maximum session spend',
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-500/5 blur-3xl rounded-full -z-10 pointer-events-none"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest">
              RailFence Policy Administration &amp; Guardrails
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Active merchant-configured policy bounds</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {saveSuccess && (
            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md shadow-sm">
              <Check className="w-3.5 h-3.5" /> Updated
            </span>
          )}

          <button
            onClick={() => {
              if (!isEditing) {
                setDiscountPercent(policy.maxDiscountPercent);
                setTxAmount(policy.maxTransactionAmount);
                setOrdersPerSession(policy.maxOrdersPerSession);
                setSpendPerSession(policy.maxSpendPerSession);
              }
              setIsEditing(!isEditing);
            }}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-[11px] text-blue-400 font-bold transition-all shadow-sm hover:shadow active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel Edit' : 'Configure Policy'}</span>
          </button>

          <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-emerald-400 font-mono shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold tracking-wider">POLICIES ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Edit Form Modal/Panel */}
      {isEditing ? (
        <form onSubmit={handleSave} className="bg-slate-950/90 border border-blue-500/30 rounded-xl p-4 mb-5 space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest pl-2">Edit Merchant Policy Guardrails</span>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Changes apply immediately in-memory</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pl-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                Max Discount %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                Single Order Cap (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={txAmount}
                onChange={(e) => setTxAmount(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                Max Orders / Session
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={ordersPerSession}
                onChange={(e) => setOrdersPerSession(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                Session Spend Cap (₹)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={spendPerSession}
                onChange={(e) => setSpendPerSession(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-[11px] font-bold tracking-wide transition-all shadow-md hover:shadow-lg flex items-center space-x-2 disabled:opacity-50 active:scale-95"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Merchant Policy</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Grid of active policy rules */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {policyDisplayItems.map((p, idx) => {
            const IconComp = p.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow transition-shadow group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-400 tracking-wide uppercase">{p.label}</span>
                  <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors">
                    <IconComp className="w-3.5 h-3.5 text-blue-400/80" />
                  </div>
                </div>
                <div>
                  <div className="text-base font-black text-slate-100 font-mono tracking-tight">{p.value}</div>
                  <div className="text-[10px] font-medium text-slate-500 mt-1">{p.subtext}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Separation of Responsibilities & Security Notice */}
      <div className="bg-slate-900/80 border border-blue-500/20 rounded-xl p-4 flex flex-col gap-3 shadow-inner mt-2">
        <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-widest">
            Architecture Separation of Responsibilities
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px] bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 overflow-x-auto">
            <span className="text-purple-400 font-semibold whitespace-nowrap">Growth Agent (LLM)</span>
            <span className="text-slate-600">→</span>
            <span className="text-emerald-400 font-bold border border-emerald-500/30 px-2 py-0.5 rounded bg-emerald-500/10 whitespace-nowrap">RailFence Policy Engine</span>
            <span className="text-slate-600">→</span>
            <span className="text-blue-400 font-semibold whitespace-nowrap">Razorpay Execution</span>
          </div>

          <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md font-mono font-bold tracking-widest self-start sm:self-auto shadow-sm whitespace-nowrap">
            ZERO-LEAKAGE BOUNDARY
          </span>
        </div>

        <div className="flex items-start space-x-3 mt-1">
          <div className="p-1.5 rounded bg-blue-500/10 mt-0.5">
            <Lock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          </div>
          <span className="text-slate-300 text-[11px] leading-relaxed max-w-3xl">
            <strong className="text-slate-100">Strict Evaluation Order:</strong> RailFence deterministically evaluates all agent proposals. Payment execution is strictly blocked unless RailFence explicitly approves. Private merchant cost &amp; floor prices are evaluated server-side and never exposed.
          </span>
        </div>
      </div>
    </div>
  );
};
