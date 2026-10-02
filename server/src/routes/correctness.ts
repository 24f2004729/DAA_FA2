import { Router, Request, Response, NextFunction } from 'express';
import type { CorrectnessTestCase, AlgorithmId } from '@bank-opt/shared';
import { runAlgorithm } from '../algorithms';
import { generateRandomScenario } from '../engine/generator';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// POST /api/correctness/run
router.post('/run', (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      algorithmIds = [],
      numCases = 10,
      maxN = 8,
      capacity = 15,
    } = req.body as {
      algorithmIds: AlgorithmId[];
      numCases: number;
      maxN: number;
      capacity: number;
    };

    if (!algorithmIds || algorithmIds.length === 0) {
      return res.status(400).json({ success: false, error: 'algorithmIds is required.' });
    }

    const optimizationAlgorithms: AlgorithmId[] = ['greedy', 'dynamic-programming', 'backtracking', 'branch-and-bound'];
    const testedAlgorithms = algorithmIds.filter(id => optimizationAlgorithms.includes(id));

    const testCases: CorrectnessTestCase[] = [];

    for (let i = 0; i < numCases; i++) {
      const n = Math.floor(Math.random() * (maxN - 3)) + 3;
      const seed = Math.floor(Math.random() * 99999);
      const cap = Math.floor(capacity * (0.6 + Math.random() * 0.8));
      const scenario = generateRandomScenario(seed, n, cap);

      // Oracle: brute force
      const oracleResult = runAlgorithm({ algorithmId: 'brute-force', scenario });

      const testedResults = testedAlgorithms.map(algId => {
        const result = runAlgorithm({ algorithmId: algId, scenario });
        const matches = result.objectiveValue === oracleResult.objectiveValue;
        return { algorithmId: algId, result, matches };
      });

      testCases.push({
        caseId: uuidv4(),
        scenario,
        oracleResult,
        testedResults,
      });
    }

    return res.json({ success: true, data: testCases });
  } catch (error) {
    return next(error);
  }
});

export default router;
