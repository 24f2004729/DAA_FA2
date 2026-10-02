import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@bank-opt/shared';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);
  
  const response: ApiResponse<null> = {
    success: false,
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred'
  };

  res.status(err.status || 500).json(response);
};
