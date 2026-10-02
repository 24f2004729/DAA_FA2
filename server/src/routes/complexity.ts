import { Router, Request, Response, NextFunction } from 'express';
import type { ComplexityResult, ComplexityDataPoint, AlgorithmId } from '@bank-opt/shared';
import { runAlgorithm } from '../algorithms';
import { generateRandomScenario } from '../engine/generator';

const router = Router();

// POST /api/complexity/benchmark
router.post('/benchmark', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { algorithmId, nValues = [3, 4, 5, 6, 7, 8, 9, 10] } = req.body as {
      algorithmId: AlgorithmId;
      nValues: number[];
    };

    if (!algorithmId) {
      return res.status(400).json({ success: false, error: 'algorithmId is required.' });
    }

    const dataPoints: ComplexityDataPoint[] = nValues.map((n: number) => {
      const capacity = Math.max(10, n * 3);
      const scenario = generateRandomScenario(42 + n, n, capacity);

      const t0 = Date.now();
      const result = runAlgorithm({ algorithmId, scenario });
      const elapsed = Date.now() - t0;

      return {
        n,
        operationCount: result.metrics.operationCount,
        elapsedMs: elapsed,
      };
    });

    const complexityResult: ComplexityResult = { algorithmId, dataPoints };
    return res.json({ success: true, data: complexityResult });
  } catch (error) {
    return next(error);
  }
});

export default router;
