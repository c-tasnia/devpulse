import express from 'express';
import authRoutes from './modules/auth/auth.routes';
import issuesRoutes from './modules/issues/issues.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();

//Global Middleware 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS 
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Health Check 

app.get('/', (_req, res) => {
  res.json({ success: true, message: 'DevPulse API is running 🚀' });
});

//  API Routes 
app.use('/api/auth', authRoutes);
app.use('/api/issues', issuesRoutes);

// Error Handling 
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
