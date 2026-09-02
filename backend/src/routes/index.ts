import { Router, Request, Response } from 'express';
import { getTelemetryMetrics, getAllTraces, sanitizeTrace } from '../telemetry/index.js';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'AgentRail Backend is healthy' });
});

/**
 * GET /api/metrics
 * Exposes aggregated growth telemetry metrics (AOV, uplift, block counts, etc.).
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await getTelemetryMetrics();
    res.json({ success: true, metrics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch telemetry metrics' });
  }
});

/**
 * GET /api/traces
 * Exposes historical decision traces for telemetry audit log and dashboard.
 * Ensures zero leakage of private merchant pricing/floor prices.
 */
router.get('/traces', async (req: Request, res: Response) => {
  try {
    const traces = await getAllTraces();
    const sanitizedTraces = sanitizeTrace(traces);
    res.json({ success: true, count: sanitizedTraces.length, traces: sanitizedTraces });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch execution traces' });
  }
});

export default router;
