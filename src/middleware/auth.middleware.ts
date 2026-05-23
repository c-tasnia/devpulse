import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verifyToken } from '../utils/jwt.utils';
import { sendError } from '../utils/response.utils';
import { AuthRequest, UserRole } from '../types';


 //JWT from Authorization
export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers['authorization'];

  if (!token) {
    sendError({
      res,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Access denied. No token provided.',
    });
    return;
  }

  try {
    req.user = verifyToken(token as string);
    next();
  } catch {
    sendError({
      res,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Invalid or expired token.',
    });
  }
}

/**
 Role-based guard
 */
export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendError({
        res,
        statusCode: StatusCodes.FORBIDDEN,
        message: 'You do not have permission to perform this action.',
      });
      return;
    }
    next();
  };
}
