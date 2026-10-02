import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '@bank-opt/shared';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Simple validation middleware stub
  // Replace with actual schema validation (zod/joi) if needed
  next();
};
