import { Request, Response } from 'express';
import { ReserveStockCommandHandler } from '@/Contexts/Inventory/StockItem/application/ReserveStock/ReserveStockCommandHandler';
import { ReserveStockCommand } from '@/Contexts/Inventory/StockItem/application/ReserveStock/ReserveStockCommand';

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
 *             type: object
 *             required:
 *               - quantity
 *               - reservationId
 *             properties:
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 1000000
 *                 description: Quantity to reserve
 *               reservationId:
 *                 type: string
 *                 description: Unique reservation identifier
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiration date for the reservation
 *               reason:
 *                 type: string
 *                 description: Optional business reason for the reservation
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
 *                 reservationDetails:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                     reason:
 *                       type: string
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
      const { quantity, reservationId, expiresAt, reason } = req.body;

      // Validate required fields
      if (!id || quantity === undefined || !reservationId) {
        res.status(400).json({
          error: 'id (in path), quantity and reservationId are required',
        });
        return;
      }

      // Validate quantity is a positive number
      if (typeof quantity !== 'number' || quantity <= 0) {
        res.status(400).json({
          error: 'quantity must be a positive number',
        });
        return;
      }

      // Validate quantity is not too large
      if (quantity > 1_000_000) {
        res.status(400).json({
          error: 'quantity cannot exceed 1,000,000',
        });
        return;
      }

      // Validate optional expiration date if provided
      let expirationDate: Date | undefined;
      if (expiresAt) {
        expirationDate = new Date(expiresAt);
        if (isNaN(expirationDate.getTime())) {
          res.status(400).json({
            error: 'expiresAt must be a valid date',
          });
          return;
        }

        // Ensure expiration is in the future
        if (expirationDate <= new Date()) {
          res.status(400).json({
            error: 'expiresAt must be a future date',
          });
          return;
        }
      }

      const command = new ReserveStockCommand(id, quantity, reservationId, expirationDate, reason);

      await this.handler.execute(command);

      // Return success response with reservation details
      res.status(200).json({
        message: 'Stock reserved successfully',
        reservationDetails: {
          id,
          quantity,
          ...(expirationDate && { expiresAt: expirationDate.toISOString() }),
          ...(reason && { reason }),
        },
      });
    } catch (error: unknown) {
      // Handle specific business errors
      if (error instanceof Error && error.message === 'Stock item not found') {
        res.status(404).json({ error: error.message });
      } else if (error instanceof Error && error.message.includes('Insufficient')) {
        res.status(409).json({ error: error.message });
      } else if (error instanceof Error && error.message.includes('negative')) {
        res.status(400).json({ error: error.message });
      } else {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(400).json({ error: errorMessage });
      }
    }
  }
}
