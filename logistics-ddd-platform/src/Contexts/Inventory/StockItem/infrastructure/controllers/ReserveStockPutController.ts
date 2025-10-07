import { Request, Response } from 'express';
import { ReserveStockCommandHandler } from '../../application/ReserveStock/ReserveStockCommandHandler';
import { ReserveStockCommand } from '../../application/ReserveStock/ReserveStockCommand';

/**
 * @swagger
 * /stock-items/{id}/reserve:
 *   put:
 *     summary: Reserve stock from an item
 *     tags: [Stock Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stock item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReserveStockRequest'
 *     responses:
 *       200:
 *         description: Stock reserved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Stock item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export class ReserveStockPutController {
  constructor(private readonly handler: ReserveStockCommandHandler) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quantity, reservationId } = req.body;

      // Validate required fields
      if (!id || quantity === undefined || !reservationId) {
        res.status(400).json({
          error: 'id (in path), quantity and reservationId are required'
        });
        return;
      }

      // Validate quantity is a positive number
      if (typeof quantity !== 'number' || quantity <= 0) {
        res.status(400).json({
          error: 'quantity must be a positive number'
        });
        return;
      }

      const command = new ReserveStockCommand(id, quantity, reservationId);
      await this.handler.execute(command);

      res.status(200).json({ message: 'Stock reserved successfully' });
    } catch (error: any) {
      // Handle specific business errors
      if (error.message === 'Stock item not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'Insufficient stock') {
        res.status(409).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }
}