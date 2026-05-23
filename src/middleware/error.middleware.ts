import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendError } from '../utils/response.utils';

// Central error handler

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error Handler]', err.message);

  sendError({
    res,
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    message: 'An unexpected server error occurred.',
    errors: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}

 //404 handler for unmatched routes.
 
export function notFoundHandler(req: Request, res: Response): void {
  sendError({
    res,
    statusCode: StatusCodes.NOT_FOUND,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
}
