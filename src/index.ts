import 'dotenv/config';
import app from './app';
import pool from './config/db';

const PORT = process.env.PORT ?? 3000;

async function startServer(): Promise<void> {
  try {
    
    await pool.query('SELECT 1');
    console.log('✅ Database connection established');

    app.listen(PORT, () => {
      console.log(`🚀 DevPulse API running on port ${PORT}`);
      console.log(`📖 Environment: ${process.env.NODE_ENV ?? 'development'}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
