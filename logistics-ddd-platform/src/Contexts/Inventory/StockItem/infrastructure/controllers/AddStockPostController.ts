import type { Request, Response } from "express";
import { AddStockCommandHandler } from "../../application/AddStock/AddStockCommandHandler";
import { AddStockCommand } from "../../application/AddStock/AddStockCommand";

/**
 * @swagger
 * /stock-items:
 *   post:
 *     summary: Add a new stock item
 *     tags: [Stock Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - name
 *               - quantity
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: Unique identifier for the stock item
 *               name:
 *                 type: string
 *                 description: Name of the stock item
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 description: Initial quantity of the stock item
 *     responses:
 *       201:
 *         description: Stock item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export class AddStockPostController {
  constructor(private readonly handler: AddStockCommandHandler) {}

  public run = async (req: Request, res: Response): Promise<void> => {
    const { id, name, quantity } = req.body ?? {};
    if (!id || !name || quantity === undefined) {
      res.status(400).json({ error: "id, name and quantity are required" });
      return;
    }
    const command = AddStockCommand.fromPrimitives({ id, name, quantity: Number(quantity) });
    await this.handler.execute(command);
    res.status(201).json({ id });
  };
}