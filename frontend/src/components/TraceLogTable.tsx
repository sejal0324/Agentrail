import React, { useState, useRef, useCallback } from 'react';
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
  const [expandedHeight, setExpandedHeight] = useState<number>(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  const expandedRowRef = useCallback((node: HTMLTableRowElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (node) {
      observerRef.current = new ResizeObserver(() => {
        setExpandedHeight(node.getBoundingClientRect().height);
      });
      observerRef.current.observe(node);
      setExpandedHeight(node.getBoundingClientRect().height);
    } else {
      setExpandedHeight(0);
    }
  }, []);

  const sortedTraces = [...traces].sort(
    (a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime()
  );

  const filteredTraces = sortedTraces.filter((t) => {
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
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-3xl rounded-full -z-10 pointer-events-none"></div>
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-inner">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest">
              Decision Trace Audit Log
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Immutable transaction evaluations</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-slate-900/50 p-1.5 rounded-lg border border-slate-800">
          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase px-2">Filter:</span>
          <div className="flex gap-1">
            {(['ALL', 'APPROVED', 'BLOCKED'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                  filter === mode
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {mode === 'ALL' ? `All (${traces.length})` : mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div 
        className="overflow-x-auto overflow-y-auto rounded-lg border border-slate-800/50 transition-all duration-300"
        style={{ maxHeight: expandedTraceId ? `calc(260px + ${expandedHeight}px)` : '260px' }}
      >
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead className="sticky top-0 z-20 shadow-sm">
            <tr className="border-b border-slate-800 bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-sm ${
                            isApproved
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-900/20'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-rose-900/20'
                          }`}
                        >
                          {isApproved ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
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
                      <td className="py-4 px-4 text-right">
                        <button className="text-slate-400 hover:text-slate-100 transition-colors bg-slate-800/50 hover:bg-slate-700/50 p-1.5 rounded-lg border border-slate-700/50">
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
                      <tr className="bg-slate-900/50 border-b border-slate-800/50" ref={expandedRowRef}>
                        <td colSpan={9} className="p-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                            {/* Proposal Items & Growth Actions */}
                            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 shadow-inner">
                              <h5 className="font-bold text-slate-200 mb-3 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                                <Layers className="w-4 h-4 text-blue-400" />
                                Proposal Items &amp; Actions
                              </h5>
                              <ul className="space-y-2 mb-4">
                                {trace.proposal.items.map((item, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-center justify-between text-[11px] bg-slate-900 px-3 py-2 rounded-lg border border-slate-800/80"
                                  >
                                    <span className="font-mono text-slate-300 font-semibold">
                                      {item.quantity}x {item.sku}
                                    </span>
                                    <span className="text-slate-400 font-mono">
                                      Proposed: <span className="text-slate-200">₹{item.proposedUnitPrice.toLocaleString('en-IN')}</span> / unit
                                    </span>
                                  </li>
                                ))}
                              </ul>

                              {trace.growthActions.length > 0 && (
                                <div className="flex items-center gap-2 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                                  <Sparkles className="w-4 h-4 text-amber-400" />
                                  <span className="text-[11px] text-slate-400 font-medium">Applied Actions:</span>
                                  <div className="flex gap-1.5">
                                    {trace.growthActions.map((action, i) => (
                                      <span
                                        key={i}
                                        className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider shadow-sm"
                                      >
                                        {action.replace('_', ' ')}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Checks & Reasons */}
                            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 shadow-inner">
                              <h5 className="font-bold text-slate-200 mb-3 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                                <Shield className="w-4 h-4 text-emerald-400" />
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
