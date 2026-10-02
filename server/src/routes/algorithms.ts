import { Router, Request, Response, NextFunction } from 'express';
import type { RunAlgorithmRequest, ComparisonReport, ComparisonEntry, AlgorithmId } from '@bank-opt/shared';
import { runAlgorithm, getAlgorithmMeta, getAlgorithmsByCategory, ALGORITHM_META } from '../algorithms';

const router = Router();

// GET /api/algorithms — list all algorithm metadata
router.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: Object.values(ALGORITHM_META) });
});

// GET /api/algorithms/categories — grouped by category
router.get('/categories', (_req: Request, res: Response) => {
  res.json({ success: true, data: getAlgorithmsByCategory() });
});

// GET /api/algorithms/:id — single algorithm metadata (must come after static routes)
router.get('/:id', (req: Request, res: Response) => {
  try {
    const meta = getAlgorithmMeta(req.params.id as AlgorithmId);
    res.json({ success: true, data: meta });
  } catch {
    res.status(404).json({ success: false, error: `Algorithm '${req.params.id}' not found.` });
  }
});

// POST /api/algorithms/run — run a single algorithm and return full result with events
router.post('/run', (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = req.body as RunAlgorithmRequest;
    if (!request.algorithmId || !request.scenario) {
      return res.status(400).json({ success: false, error: 'algorithmId and scenario are required.' });
    }
    const result = runAlgorithm(request);
    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
});

// POST /api/algorithms/compare — run multiple algorithms on frozen scenario
router.post('/compare', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { algorithmIds, scenario, options = {} } = req.body as {
      algorithmIds: AlgorithmId[];
      scenario: RunAlgorithmRequest['scenario'];
      options?: Record<AlgorithmId, Record<string, unknown>>;
    };

    if (!algorithmIds || !scenario) {
      return res.status(400).json({ success: false, error: 'algorithmIds and scenario are required.' });
    }

    const entries: ComparisonEntry[] = algorithmIds.map(id => {
      const result = runAlgorithm({
        algorithmId: id,
        scenario,
        options: (options as Record<string, Record<string, unknown>>)[id] ?? {},
      });
      return { algorithmId: id, result };
    });

    const report: ComparisonReport = {
      scenarioId: scenario.scenarioId,
      scenarioVersion: scenario.version,
      entries,
      generatedAt: new Date().toISOString(),
    };

    return res.json({ success: true, data: report });
  } catch (error) {
    return next(error);
  }
});

export default router;
