import React, { useState } from 'react';
import { DecisionTrace } from '../types/telemetry';
import {
  FileText,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Shield,
  CreditCard,
  Hash,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';

interface TraceLogTableProps {
  traces: DecisionTrace[];
  loading: boolean;
}

export const TraceLogTable: React.FC<TraceLogTableProps> = ({ traces, loading }) => {
  const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'BLOCKED'>('ALL');
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  const filteredTraces = traces.filter((t) => {
    if (filter === 'APPROVED') return t.evaluationStatus === 'APPROVED';
    if (filter === 'BLOCKED') return t.evaluationStatus === 'BLOCKED';
    return true;
  });

  const toggleExpand = (traceId: string) => {
    setExpandedTraceId((prev) => (prev === traceId ? null : traceId));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatContractHash = (hash?: string) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
              Decision Trace Audit Log
            </h3>
            <p className="text-[11px] text-slate-400">Immutable transaction evaluations</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Filter:</span>
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
            {(['ALL', 'APPROVED', 'BLOCKED'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  filter === mode
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'ALL' ? `All (${traces.length})` : mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Trace / Time</th>
              <th className="py-2.5 px-3">Session &amp; Buyer</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Base vs Proposed</th>
              <th className="py-2.5 px-3">Uplift</th>
              <th className="py-2.5 px-3">Policy Checks</th>
              <th className="py-2.5 px-3">Razorpay</th>
              <th className="py-2.5 px-3">Contract Hash</th>
              <th className="py-2.5 px-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                  Loading decision traces...
                </td>
              </tr>
            ) : filteredTraces.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                  No decision traces recorded yet.
                </td>
              </tr>
            ) : (
              filteredTraces.map((trace) => {
                const isExpanded = expandedTraceId === trace.traceId;
                const isApproved = trace.evaluationStatus === 'APPROVED';

                return (
                  <React.Fragment key={trace.traceId}>
                    <tr
                      onClick={() => toggleExpand(trace.traceId)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      {/* Trace / Time */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-slate-200 font-medium text-[11px]">
                          {trace.transactionId}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatDate(trace.evaluatedAt)}
                        </div>
                      </td>

                      {/* Session & Buyer */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-slate-300 text-[11px]">{trace.sessionId}</div>
                        <div className="text-[10px] text-slate-500">{trace.buyerId}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isApproved
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          }`}
                        >
                          {isApproved ? (
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-400" />
                          )}
                          {trace.evaluationStatus}
                        </span>
                      </td>

                      {/* Base vs Proposed */}
                      <td className="py-3 px-3">
                        <div className="text-[11px] font-medium text-slate-200">
                          {formatCurrency(trace.proposal.proposedTotal)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Base: {formatCurrency(trace.aovUplift?.baseTotal ?? trace.proposal.baseTotal)}
                        </div>
                      </td>

                      {/* Uplift */}
                      <td className="py-3 px-3">
                        {trace.aovUplift && trace.aovUplift.upliftAmount > 0 ? (
                          <div className="text-emerald-400 font-semibold text-[11px]">
                            +{formatCurrency(trace.aovUplift.upliftAmount)}
                            <span className="text-[10px] ml-1 bg-emerald-500/10 text-emerald-400 px-1 py-0.2 rounded border border-emerald-500/20">
                              +{trace.aovUplift.upliftPercent}%
                            </span>
                          </div>
                        ) : (
                          <div className="text-slate-500 text-[11px]">₹0 (0%)</div>
                        )}
                      </td>

                      {/* Policy Checks (6 visual indicators) */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1">
                          {Object.entries(trace.checks || {}).map(([checkKey, pass]) => (
                            <span
                              key={checkKey}
                              title={`${checkKey}: ${pass ? 'PASSED' : 'FAILED'}`}
                              className={`w-2 h-2 rounded-full ${
                                pass ? 'bg-emerald-400' : 'bg-rose-500'
                              }`}
                            />
                          ))}
                        </div>
                      </td>

                      {/* Razorpay */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 font-mono">
                          <CreditCard className="w-3 h-3 text-indigo-400" />
                          {trace.razorpayCallsCount} call{trace.razorpayCallsCount !== 1 ? 's' : ''}
                        </span>
                      </td>

                      {/* Contract Hash */}
                      <td className="py-3 px-3">
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {formatContractHash(trace.contractHash)}
                        </span>
                      </td>

                      {/* Toggle button */}
                      <td className="py-3 px-3 text-right">
                        <button className="text-slate-400 hover:text-slate-200">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr className="bg-slate-950/80">
                        <td colSpan={9} className="p-4 border-b border-slate-800">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            {/* Proposal Items & Growth Actions */}
                            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
                              <h5 className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-blue-400" />
                                Proposal Items &amp; Actions
                              </h5>
                              <ul className="space-y-1.5 mb-3">
                                {trace.proposal.items.map((item, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-center justify-between text-[11px] bg-slate-950/50 px-2 py-1 rounded border border-slate-800/50"
                                  >
                                    <span className="font-mono text-slate-300">
                                      {item.quantity}x {item.sku}
                                    </span>
                                    <span className="text-slate-400">
                                      Proposed: {formatCurrency(item.proposedUnitPrice)} / unit
                                    </span>
                                  </li>
                                ))}
                              </ul>

                              {trace.growthActions.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <Sparkles className="w-3 h-3 text-amber-400" />
                                  <span className="text-[11px] text-slate-400">Applied Growth Actions:</span>
                                  <div className="flex gap-1">
                                    {trace.growthActions.map((action, i) => (
                                      <span
                                        key={i}
                                        className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono"
                                      >
                                        {action}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Checks & Reasons */}
                            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
                              <h5 className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                Policy Evaluation Details
                              </h5>

                              {trace.reasons.length > 0 ? (
                                <div className="space-y-1.5">
                                  <span className="text-[11px] font-medium text-rose-400">
                                    Violation Reasons:
                                  </span>
                                  {trace.reasons.map((reason, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] rounded font-mono leading-relaxed"
                                    >
                                      {reason}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] rounded flex items-center gap-1.5">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Passed all RailFence guardrail checks cleanly.</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
