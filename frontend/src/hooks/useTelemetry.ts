import { useState, useEffect, useCallback } from 'react';
import { TelemetryMetrics, DecisionTrace } from '../types/telemetry';

export interface UseTelemetryResult {
  metrics: TelemetryMetrics | null;
  traces: DecisionTrace[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

export function useTelemetry(refreshIntervalMs = 5000): UseTelemetryResult {
  const [metrics, setMetrics] = useState<TelemetryMetrics | null>(null);
  const [traces, setTraces] = useState<DecisionTrace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTelemetry = useCallback(async () => {
    try {
      const [metricsRes, tracesRes] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/traces'),
      ]);

      if (!metricsRes.ok) {
        throw new Error(`Metrics API HTTP ${metricsRes.status}`);
      }
      if (!tracesRes.ok) {
        throw new Error(`Traces API HTTP ${tracesRes.status}`);
      }

      const metricsData = await metricsRes.json();
      const tracesData = await tracesRes.json();

      if (!metricsData.success) {
        throw new Error(metricsData.error || 'Failed to fetch metrics');
      }
      if (!tracesData.success) {
        throw new Error(tracesData.error || 'Failed to fetch traces');
      }

      setMetrics(metricsData.metrics);
      setTraces(tracesData.traces || []);
      setError(null);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Error connecting to telemetry endpoints');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();

    if (refreshIntervalMs > 0) {
      const timer = setInterval(() => {
        fetchTelemetry();
      }, refreshIntervalMs);

      return () => clearInterval(timer);
    }
  }, [fetchTelemetry, refreshIntervalMs]);

  return {
    metrics,
    traces,
    loading,
    error,
    lastUpdated,
    refetch: fetchTelemetry,
  };
}
