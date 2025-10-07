import { Router } from 'express';
import { AddStockPostController } from '../../../../Contexts/Inventory/StockItem/infrastructure/controllers/AddStockPostController';
import { ReserveStockPutController } from '../../../../Contexts/Inventory/StockItem/infrastructure/controllers/ReserveStockPutController';
import { GetStockItemsController } from '../../../../Contexts/Inventory/StockItem/infrastructure/controllers/GetStockItemsController';
import { AddStockCommandHandler } from '../../../../Contexts/Inventory/StockItem/application/AddStock/AddStockCommandHandler';
import { ReserveStockCommandHandler } from '../../../../Contexts/Inventory/StockItem/application/ReserveStock/ReserveStockCommandHandler';
import { TypeOrmStockItemRepository } from '../../../../Contexts/Inventory/StockItem/infrastructure/persistence/TypeOrmStockItemRepository';
import { EventBus } from '../../../../Shared/domain/EventBus';
import { log } from '../../../../utils/log';

export function createStockItemsRouter(eventBus?: EventBus): Router {
  const router = Router();

  const repository = new TypeOrmStockItemRepository(eventBus);

  // Add Stock handlers
  const addStockHandler = new AddStockCommandHandler(repository, eventBus);
  const addStockController = new AddStockPostController(addStockHandler);

  // Reserve Stock handlers
  const reserveStockHandler = new ReserveStockCommandHandler(repository, eventBus);
  const reserveStockController = new ReserveStockPutController(reserveStockHandler);

  // Get Stock Items handler
  const getStockItemsController = new GetStockItemsController(repository);

  router.post('/stock-items', (req, res) => addStockController.run(req, res));
  router.get('/stock-items', (req, res) => getStockItemsController.run(req, res));
  router.put('/stock-items/:id/reserve', (req, res) => {
    log.info(`Reserve route hit: ${req.params.id} ${JSON.stringify(req.body)}`);
    return reserveStockController.run(req, res);
  });

  return router;
}