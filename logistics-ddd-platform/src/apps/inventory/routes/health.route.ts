import { Router } from 'express';
import { AppDataSource } from '@/Shared/infrastructure/persistence/TypeOrmConfig';

export function createHealthRouter(): Router {
  const router = Router();

  router.get('/health', async (req, res) => {
    try {
      // Test database connectivity
      await AppDataSource.query('SELECT 1');

      res.status(200).json({
        status: 'ok',
        service: 'inventory-api',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        service: 'inventory-api',
        error: (error as Error).message,
      });
    }
  });

  return router;
}
