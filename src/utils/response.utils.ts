import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

interface SuccessOptions<T> {
  res: Response;
  statusCode?: number;
  message: string;
  data?: T;
}

interface ErrorOptions {
  res: Response;
  statusCode?: number;
  message: string;
  errors?: unknown;
}


export function sendSuccess<T>({
  res,
  statusCode = StatusCodes.OK,
  message,
  data,
}: SuccessOptions<T>): void {
  const body: Record<string, unknown> = { success: true, message };
  if (data !== undefined) body.data = data;
  res.status(statusCode).json(body);
}


export function sendError({
  res,
  statusCode = StatusCodes.INTERNAL_SERVER_ERROR,
  message,
  errors,
}: ErrorOptions): void {
  const body: Record<string, unknown> = { success: false, message };
  if (errors !== undefined) body.errors = errors;
  res.status(statusCode).json(body);
}
