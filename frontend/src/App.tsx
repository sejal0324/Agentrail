import React from 'react';
import { useTelemetry } from './hooks/useTelemetry';
import { ChatPanel } from './components/ChatPanel';
import { MetricsOverview } from './components/MetricsOverview';
import { BlockDistribution } from './components/BlockDistribution';
import { TraceLogTable } from './components/TraceLogTable';
import { PolicyAdminView } from './components/PolicyAdminView';
import {
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Cpu,
  Activity,
  Layers,
} from 'lucide-react';

export default function App() {
  const { metrics, traces, loading, error, lastUpdated, refetch } = useTelemetry(5000);

  return (
    <div className="min-h-screen bg-[#050816] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Global Background Glows */}
      <div className="fixed top-0 left-1/4 w-[800px] h-[800px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-900/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>

      {/* Top Navigation / Dashboard Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-30 shadow-lg">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 tracking-tight">AgentRail</h1>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide mt-0.5">
                Growth Agent &amp; RailFence Policy Engine Interface
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Live Indicator */}
            <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium text-[11px]">Live Telemetry</span>
              {lastUpdated && (
                <span className="text-[10px] text-slate-500 hidden sm:inline font-mono">
                  ({lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
                </span>
              )}
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={() => refetch()}
              disabled={loading}
              className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg border border-slate-700/70 transition-colors disabled:opacity-50"
              title="Manual Telemetry Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Error Alert Banner */}
      {error && (
        <div className="bg-rose-500/10 border-b border-rose-500/30 text-rose-300 px-4 py-2.5 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>
              <strong>Telemetry Connection Error:</strong> {error}. Make sure backend service is running on port 3000.
            </span>
          </div>
          <button
            onClick={() => refetch()}
            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 rounded text-[11px] font-medium transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main Dual-Panel Layout */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-0">
        {/* LEFT PANEL: Interactive Buyer Agent Chat Panel (5 columns on lg) */}
        <section className="lg:col-span-5 flex flex-col lg:pr-10 lg:border-r lg:border-slate-800/60">
          <ChatPanel onTransactionComplete={refetch} />
        </section>

        {/* RIGHT PANEL: Telemetry & Metrics Dashboard (7 columns on lg) */}
        <section className="lg:col-span-7 flex flex-col space-y-6 lg:pl-10">
          {/* Merchant Workspace Identity Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  Merchant Dashboard
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Live Control Center
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5 font-normal tracking-wide">
                  Real-time growth, policy &amp; transaction oversight
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 border border-slate-700/60 rounded-md text-xs text-slate-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium text-[11px]">RailFence Operational</span>
            </div>
          </div>

          {/* Top Live Metrics Cards */}
          <MetricsOverview metrics={metrics} loading={loading} />

          {/* Active RailFence Policy Status */}
          <PolicyAdminView />

          {/* Categorized Policy Block Distribution */}
          <BlockDistribution blockCounts={metrics?.categorizedBlockCounts} loading={loading} />

          {/* Decision Trace Audit Log Table */}
          <TraceLogTable traces={traces} loading={loading} />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3 text-center text-xs text-slate-500">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <span>AgentRail Architecture — Dual-Panel Growth &amp; Trust Interface</span>
          <span className="font-mono text-[11px] text-slate-600">M10 Dashboard UI</span>
        </div>
      </footer>
    </div>
  );
}
