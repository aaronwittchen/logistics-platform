import type { Request, Response } from "express";
import { AddStockCommandHandler } from "../../application/AddStock/AddStockCommandHandler";
import { AddStockCommand } from "../../application/AddStock/AddStockCommand";

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


