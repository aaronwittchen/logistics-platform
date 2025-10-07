import { Request, Response } from 'express';
import type { StockItemRepository } from '../../domain/StockItemRepository';

/**
 * @swagger
 * /stock-items:
 *   get:
 *     summary: Get all stock items
 *     tags: [Stock Items]
 *     responses:
 *       200:
 *         description: List of all stock items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StockItem'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export class GetStockItemsController {
  constructor(private readonly repository: StockItemRepository) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const stockItems = await this.repository.findAll();

      const primitives = stockItems.map(item => item.toPrimitives());

      res.status(200).json(primitives);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}