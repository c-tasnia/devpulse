import { Router } from 'express';
import {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
} from './issues.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', getAllIssues);

router.get('/:id', getIssueById);

router.post('/', authenticate, createIssue);

router.patch('/:id', authenticate, updateIssue);

router.delete('/:id', authenticate, requireRole('maintainer'), deleteIssue);

export default router;
