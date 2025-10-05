import { AggregateRoot } from "@/Shared/domain/AggregateRoot";
import { StockItemId } from "./StockItemId";
import { StockItemName } from "./StockItemName";
import { Quantity } from "./Quantity";
import { StockItemAdded } from "./events/StockItemAdded";

/**
 * Interface representing the primitive (serializable) shape of a StockItem.
 */
export interface StockItemPrimitives {
  id: string;
  name: string;
  quantity: number;
}

/**
 * StockItem
 *
 * AggregateRoot representing a Stock Item in the domain.
 *
 * Responsibilities:
 * - Encapsulate StockItem state (id, name, quantity)
 * - Ensure invariants and consistency via AggregateRoot
 * - Emit domain events on important changes (e.g., addition)
 */
export class StockItem extends AggregateRoot {
  /**
   * Private constructor to enforce creation through the static `add` method.
   */
  private constructor(
    private readonly _id: StockItemId,
    private _name: StockItemName,
    private _quantity: Quantity
  ) {
    super(); // call AggregateRoot constructor
  }

  /**
   * Factory method to create a new StockItem and record the "StockItemAdded" domain event.
   */
  static add(params: { id: StockItemId; name: StockItemName; quantity: Quantity }): StockItem {
    const item = new StockItem(params.id, params.name, params.quantity);
    // Record a domain event for the addition of the stock item
    item.record(new StockItemAdded({ aggregateId: params.id }, params.name, params.quantity));
    return item;
  }

  /** Getter for the StockItem ID */
  get id(): StockItemId {
    return this._id;
  }

  /** Getter for the StockItem Name */
  get name(): StockItemName {
    return this._name;
  }

  /** Getter for the StockItem Quantity */
  get quantity(): Quantity {
    return this._quantity;
  }

  /**
   * Convert the StockItem to a plain object for serialization or external use.
   */
  toPrimitives(): StockItemPrimitives {
    return {
      id: this._id.value,
      name: this._name.value,
      quantity: this._quantity.value,
    };
  }
}
