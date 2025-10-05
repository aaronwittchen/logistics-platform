import { Column, Entity, PrimaryColumn } from "typeorm";
import { StockItem } from "../../domain/StockItem";
import { StockItemId } from "../../domain/StockItemId";
import { StockItemName } from "../../domain/StockItemName";
import { Quantity } from "../../domain/Quantity";

/**
 * TypeORM entity representing the StockItem table in the database.
 *
 * Responsibilities:
 * - Define the database schema for stock items
 * - Map between database rows and domain aggregates
 */
@Entity({ name: "stock_items" })
export class StockItemEntity {
  /** Primary key (UUID string) */
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  /** Stock item name (max 100 characters) */
  @Column({ type: "varchar", length: 100 })
  name!: string;

  /** Quantity of stock item */
  @Column({ type: "int" })
  quantity!: number;

  /**
   * Converts a StockItem domain aggregate into a TypeORM entity.
   * Used before persisting to the database.
   *
   * @param domain - the StockItem aggregate
   * @returns a StockItemEntity ready for persistence
   */
  static fromDomain(domain: StockItem): StockItemEntity {
    const e = new StockItemEntity();
    e.id = domain.id.value;
    e.name = domain.name.value;
    e.quantity = domain.quantity.value;
    return e;
  }

  /**
   * Converts this database entity back into a StockItem domain aggregate.
   *
   * @returns a StockItem aggregate
   */
  toDomain(): StockItem {
    return StockItem.add({
      id: StockItemId.from(this.id),
      name: StockItemName.from(this.name),
      quantity: Quantity.from(this.quantity),
    });
  }
}
