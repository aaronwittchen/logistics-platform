import { Router } from 'express';
import { AddStockPostController } from '../../../../Contexts/Inventory/StockItem/infrastructure/controllers/AddStockPostController';
import { AddStockCommandHandler } from '../../../../Contexts/Inventory/StockItem/application/AddStock/AddStockCommandHandler';
import { TypeOrmStockItemRepository } from '../../../../Contexts/Inventory/StockItem/infrastructure/persistence/TypeOrmStockItemRepository';
import { EventBus } from '../../../../Shared/domain/EventBus';

export function createStockItemsRouter(eventBus?: EventBus): Router {
  const router = Router();

  const repository = new TypeOrmStockItemRepository(eventBus);
  const handler = new AddStockCommandHandler(repository, eventBus);
  const controller = new AddStockPostController(handler);

  router.post('/stock-items', (req, res) => controller.run(req, res));

  return router;
}


