import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { queryOne, queryMany } from '../../utils/db.utils';
import { sendSuccess, sendError } from '../../utils/response.utils';
import {
  AuthRequest,
  Issue,
  IssueWithReporter,
  ReporterInfo,
  CreateIssueBody,
  UpdateIssueBody,
  IssueQueryParams,
} from '../../types';



async function attachReporters(issues: Issue[]): Promise<IssueWithReporter[]> {
  if (issues.length === 0) return [];

 
  const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];


  const placeholders = reporterIds.map((_, idx) => `$${idx + 1}`).join(', ');
  const reporters = await queryMany<ReporterInfo>(
    `SELECT id, name, role FROM users WHERE id IN (${placeholders})`,
    reporterIds
  );

  const reporterMap = new Map(reporters.map((r) => [r.id, r]));

  return issues.map(({ reporter_id, ...rest }) => ({
    ...rest,
    reporter: reporterMap.get(reporter_id) ?? { id: reporter_id, name: 'Unknown', role: 'contributor' },
  }));
}

// POST /api/issues

export async function createIssue(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { title, description, type }: CreateIssueBody = req.body;
    const reporterId = req.user!.id;

    //Validation

    if (!title || !description || !type) {
      sendError({ res, statusCode: StatusCodes.BAD_REQUEST, message: 'title, description, and type are required.' });
      return;
    }
    if (title.length > 150) {
      sendError({ res, statusCode: StatusCodes.BAD_REQUEST, message: 'title must not exceed 150 characters.' });
      return;
    }
    if (description.length < 20) {
      sendError({ res, statusCode: StatusCodes.BAD_REQUEST, message: 'description must be at least 20 characters.' });
      return;
    }
    if (!['bug', 'feature_request'].includes(type)) {
      sendError({ res, statusCode: StatusCodes.BAD_REQUEST, message: 'type must be bug or feature_request.' });
      return;
    }

    const issue = await queryOne<Issue>(
      `INSERT INTO issues (title, description, type, reporter_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
      [title, description, type, reporterId]
    );

    sendSuccess({ res, statusCode: StatusCodes.CREATED, message: 'Issue created successfully', data: issue });
  } catch (err) {
    next(err);
  }
}

// GET /api/issues

export async function getAllIssues(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { sort = 'newest', type, status } = req.query as IssueQueryParams;

    // Validate query params 

    if (sort && !['newest', 'oldest'].includes(sort)) {
      sendError({ res, statusCode: StatusCodes.BAD_REQUEST, message: 'sort must be newest or oldest.' });
      return;
    }
    if (type && !['bug', 'feature_request'].includes(type)) {
      sendError({ res, statusCode: StatusCodes.BAD_REQUEST, message: 'type must be bug or feature_request.' });
      return;
    }
    if (status && !['open', 'in_progress', 'resolved'].includes(status)) {
      sendError({ res, statusCode: StatusCodes.BAD_REQUEST, message: 'status must be open, in_progress, or resolved.' });
      return;
    }

    //dynamic WHERE clause

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (type) {
      conditions.push(`type = $${paramIdx++}`);
      params.push(type);
    }
    if (status) {
      conditions.push(`status = $${paramIdx++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = sort === 'oldest' ? 'ORDER BY created_at ASC' : 'ORDER BY created_at DESC';

    const issues = await queryMany<Issue>(
      `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
       FROM issues ${whereClause} ${orderClause}`,
      params
    );

    const issuesWithReporters = await attachReporters(issues);

    sendSuccess({ res, message: 'Issues retrived successfully', data: issuesWithReporters });
  } catch (err) {
    next(err);
  }
}

//GET

export async function getIssueById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError({ res, statusCode: StatusCodes.BAD_REQUEST, message: 'Invalid issue ID.' });
      return;
    }

    const issue = await queryOne<Issue>(
      'SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues WHERE id = $1',
      [id]
    );

    if (!issue) {
      sendError({ res, statusCode: StatusCodes.NOT_FOUND, message: 'Issue not found.' });
      return;
    }

    const [issueWithReporter] = await attachReporters([issue]);
    sendSuccess({ res, message: 'Issue retrived successfully', data: issueWithReporter });
  } catch (err) {
    next(err);
  }
}

//PATCH

export async function updateIssue(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError({ res, statusCode: StatusCodes.BAD_REQUEST, message: 'Invalid issue ID.' });
      return;
    }

    const issue = await queryOne<Issue>(
      'SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues WHERE id = $1',
      [id]
    );

    if (!issue) {
      sendError({ res, statusCode: StatusCodes.NOT_FOUND, message: 'Issue not found.' });
      return;
    }

    const { role, id: userId } = req.user!;

    //Permission check 

    if (role === 'contributor') {
      if (issue.reporter_id !== userId) {
        sendError({ res, statusCode: StatusCodes.FORBIDDEN, message: 'You can only edit your own issues.' });
        return;
      }
      if (issue.status !== 'open') {
        sendError({ res, statusCode: StatusCodes.CONFLICT, message: 'Contributors can only edit issues with open status.' });
        return;
      }
    }

    const { title, description, type }: UpdateIssueBody = req.body;

    // Validate provided fields 

    if (title !== undefined && title.length > 150) {
      sendError({ res, statusCode: StatusCodes.BAD_REQUEST, message: 'title must not exceed 150 characters.' });
      return;
    }
    if (description !== undefined && description.length < 20) {
      sendError({ res, statusCode: StatusCodes.BAD_REQUEST, message: 'description must be at least 20 characters.' });
      return;
    }
    if (type !== undefined && !['bug', 'feature_request'].includes(type)) {
      sendError({ res, statusCode: StatusCodes.BAD_REQUEST, message: 'type must be bug or feature_request.' });
      return;
    }

    //dynamic SET clause 

    const updates: string[] = [];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (title !== undefined) { updates.push(`title = $${paramIdx++}`); params.push(title); }
    if (description !== undefined) { updates.push(`description = $${paramIdx++}`); params.push(description); }
    if (type !== undefined) { updates.push(`type = $${paramIdx++}`); params.push(type); }

    if (updates.length === 0) {
      sendError({ res, statusCode: StatusCodes.BAD_REQUEST, message: 'No valid fields provided for update.' });
      return;
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const updated = await queryOne<Issue>(
      `UPDATE issues SET ${updates.join(', ')} WHERE id = $${paramIdx}
       RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
      params
    );

    sendSuccess({ res, message: 'Issue updated successfully', data: updated });
  } catch (err) {
    next(err);
  }
}

//DELETE 

export async function deleteIssue(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError({ res, statusCode: StatusCodes.BAD_REQUEST, message: 'Invalid issue ID.' });
      return;
    }

    const issue = await queryOne<Issue>('SELECT id FROM issues WHERE id = $1', [id]);
    if (!issue) {
      sendError({ res, statusCode: StatusCodes.NOT_FOUND, message: 'Issue not found.' });
      return;
    }

    await queryOne('DELETE FROM issues WHERE id = $1', [id]);

    sendSuccess({ res, message: 'Issue deleted successfully' });
  } catch (err) {
    next(err);
  }
}
