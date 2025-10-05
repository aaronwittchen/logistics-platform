/**
 * AddStockCommand
 *
 * Represents a command to add a new stock item to inventory.
 * 
 * Responsibilities:
 * - Encapsulate all data required to perform the "add stock" use case
 * - Provide a type-safe, immutable object for application services to process
 */
export class AddStockCommand {
    /**
     * Constructor
     *
     * @param id - unique identifier for the stock item
     * @param name - name of the stock item
     * @param quantity - quantity to add
     */
    constructor(
      public readonly id: string,
      public readonly name: string,
      public readonly quantity: number
    ) {}
  
    /**
     * Factory method to create a command from plain data (primitives)
     *
     * @param params - plain object with id, name, and quantity
     * @returns a new AddStockCommand instance
     */
    static fromPrimitives(params: { id: string; name: string; quantity: number }): AddStockCommand {
      return new AddStockCommand(params.id, params.name, params.quantity);
    }
  }
  