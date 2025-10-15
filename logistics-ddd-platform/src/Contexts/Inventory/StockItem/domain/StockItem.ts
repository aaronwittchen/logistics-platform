import { AggregateRoot } from '@/Shared/domain/AggregateRoot';
import { DomainEvent } from '@/Shared/domain/DomainEvent';
import { StockItemId } from './StockItemId';
import { StockItemName } from './StockItemName';
import { Quantity } from './Quantity';
import { StockItemAdded } from './events/StockItemAdded';
import { StockItemReserved } from './events/StockItemReserved';
import { StockItemReservationReleased } from './events/StockItemReservationReleased';
import { StockQuantityAdjusted } from './events/StockQuantityAdjusted';


/**
 * Interface representing the primitive (serializable) shape of a StockItem.
 */
export interface StockItemPrimitives {
  id: string;
  name: string;
  availableQuantity: number;
  reservedQuantity: number;
  totalQuantity: number;
  quantity: number; // Available quantity for backward compatibility
  version: number;
}

/**
 * Interface for reservation tracking
 */
interface Reservation {
  reservationId: string;
  quantity: Quantity;
  reservedAt: Date;
  expiresAt?: Date;
  reason?: string;
}

/**
 * StockItem
 *
 * AggregateRoot representing a Stock Item in the domain.
 *
 * Responsibilities:
 * - Encapsulate StockItem state (id, name, quantities)
 * - Manage inventory levels (available vs reserved)
 * - Track and validate reservations
 * - Ensure invariants and consistency via AggregateRoot
 * - Emit domain events on important changes
 * - Support comprehensive inventory operations
 */
export class StockItem extends AggregateRoot {
  private readonly _id: StockItemId;
  private _name: StockItemName;
  private _totalQuantity: Quantity;
  private _reservedQuantity: Quantity;
  private _reservations: Map<string, Reservation>;
  private _version: number;

  /**
   * Private constructor to enforce creation through factory methods.
   */
  private constructor(
    id: StockItemId,
    name: StockItemName,
    totalQuantity: Quantity,
    reservedQuantity: Quantity = Quantity.from(0),
  ) {
    super();
    this._id = id;
    this._name = name;
    this._totalQuantity = totalQuantity;
    this._reservedQuantity = reservedQuantity;
    this._reservations = new Map();
    this._version = 1;

    this.ensureInvariants();
  }

  /**
   * Factory method to create a new StockItem and record the "StockItemAdded" domain event.
   */
  static add(params: { 
    id: StockItemId; 
    name: StockItemName; 
    quantity: Quantity 
  }): StockItem {
    if (params.quantity.value < 0) {
      throw new Error('Initial stock quantity cannot be negative');
    }

    const item = new StockItem(params.id, params.name, params.quantity);
    item.record(new StockItemAdded({ aggregateId: params.id }, params.name, params.quantity));
    return item;
  }

  /**
   * Factory method to recreate StockItem from repository data.
   */
  static fromPrimitives(primitives: StockItemPrimitives): StockItem {
    const item = new StockItem(
      StockItemId.from(primitives.id),
      StockItemName.from(primitives.name),
      Quantity.from(primitives.totalQuantity),
      Quantity.from(primitives.reservedQuantity || 0)
    );
    
    item._version = primitives.version || 1;
    return item;
  }

  /**
   * Reserve stock from this item
   *
   * @param quantity - the quantity to reserve
   * @param reservationId - unique identifier for this reservation
   * @param expiresAt - optional expiration date for the reservation
   * @param reason - optional reason for the reservation
   * @throws Error if insufficient available stock
   */
  reserve(
    quantity: Quantity, 
    reservationId: string, 
    expiresAt?: Date, 
    reason?: string
  ): void {
    if (this.isReservationExpired(reservationId)) {
      this.releaseReservation(reservationId);
    }

    const availableQuantity = this.getAvailableQuantity();
    if (!availableQuantity.isGreaterThanOrEqual(quantity)) {
      throw new Error(`Insufficient stock. Available: ${availableQuantity.value}, Requested: ${quantity.value}`);
    }

    if (quantity.value <= 0) {
      throw new Error('Reservation quantity must be greater than zero');
    }

    // Check if this is updating an existing reservation
    const existingReservation = this._reservations.get(reservationId);
    if (existingReservation) {
      const quantityDifference = quantity.subtract(existingReservation.quantity);
      this._reservedQuantity = Quantity.from(this._reservedQuantity.value + quantityDifference.value);
    } else {
      this._reservedQuantity = Quantity.from(this._reservedQuantity.value + quantity.value);
    }

    // Update or create reservation record
    this._reservations.set(reservationId, {
      reservationId,
      quantity,
      reservedAt: new Date(),
      expiresAt,
      reason,
    });

    this.ensureInvariants();
    this.record(new StockItemReserved(
      { aggregateId: this._id }, 
      this._id, 
      quantity, 
      reservationId
    ));
  }

  /**
   * Release a stock reservation
   *
   * @param reservationId - the reservation to release
   * @throws Error if reservation not found
   */
  releaseReservation(reservationId: string): void {
    const reservation = this._reservations.get(reservationId);
    if (!reservation) {
      throw new Error(`Reservation ${reservationId} not found`);
    }

    this._reservedQuantity = this._reservedQuantity.subtract(reservation.quantity);
    this._reservations.delete(reservationId);

    this.ensureInvariants();
    this.record(new StockItemReservationReleased(
      { aggregateId: this._id },
      this._id,
      reservation.quantity,
      reservationId
    ));
  }

  /**
   * Add stock to this item
   *
   * @param quantity - the quantity to add
   * @param reason - optional reason for the addition
   * @throws Error if quantity is invalid
   */
  addStock(quantity: Quantity, reason?: string): void {
    if (quantity.value <= 0) {
      throw new Error('Added quantity must be greater than zero');
    }

    const originalQuantity = this._totalQuantity;
    this._totalQuantity = Quantity.from(this._totalQuantity.value + quantity.value);

    this.ensureInvariants();
    this.record(new StockQuantityAdjusted(
      { aggregateId: this._id },
      this._id,
      originalQuantity,
      this._totalQuantity,
      quantity,
      'ADDITION',
      reason
    ));
  }

  /**
   * Adjust stock quantity (can be positive or negative)
   *
   * @param quantity - the quantity adjustment (positive = add, negative = remove)
   * @param reason - reason for the adjustment
   * @throws Error if adjustment would result in negative total quantity
   */
  adjustStock(quantity: Quantity, reason?: string): void {
    const newTotalQuantity = Quantity.from(this._totalQuantity.value + quantity.value);
    
    if (newTotalQuantity.value < 0) {
      throw new Error('Stock adjustment would result in negative quantity');
    }

    // If reducing stock, ensure we don't go below reserved quantity
    if (quantity.value < 0 && newTotalQuantity.value < this._reservedQuantity.value) {
      throw new Error('Cannot reduce stock below reserved quantity');
    }

    const originalQuantity = this._totalQuantity;
    this._totalQuantity = newTotalQuantity;

    this.ensureInvariants();
    this.record(new StockQuantityAdjusted(
      { aggregateId: this._id },
      this._id,
      originalQuantity,
      this._totalQuantity,
      quantity,
      quantity.value > 0 ? 'ADDITION' : 'REDUCTION',
      reason
    ));
  }

  /**
   * Release expired reservations automatically
   */
  releaseExpiredReservations(): void {
    const now = new Date();
    const expiredReservations: string[] = [];

    for (const [reservationId, reservation] of this._reservations) {
      if (reservation.expiresAt && reservation.expiresAt <= now) {
        expiredReservations.push(reservationId);
      }
    }

    for (const reservationId of expiredReservations) {
      this.releaseReservation(reservationId);
    }
  }

  /**
   * Update the name of the stock item
   *
   * @param newName - the new name for the stock item
   */
  updateName(newName: StockItemName): void {
    this._name = newName;

    // Note: We might want to create a StockItemRenamed event here
    // this.record(new StockItemRenamed({ aggregateId: this._id }, oldName, newName));
  }

  /** Getter for the StockItem ID */
  get id(): StockItemId {
    return this._id;
  }

  /** Getter for the StockItem Name */
  get name(): StockItemName {
    return this._name;
  }

  /** Getter for the StockItem Quantity (available quantity for backward compatibility) */
  get quantity(): Quantity {
    return this.availableQuantity;
  }

  /** Getter for the total quantity (available + reserved) */
  get totalQuantity(): Quantity {
    return this._totalQuantity;
  }

  /** Getter for the available quantity (total - reserved) */
  get availableQuantity(): Quantity {
    return this._totalQuantity.subtract(this._reservedQuantity);
  }

  /** Getter for the reserved quantity */
  get reservedQuantity(): Quantity {
    return this._reservedQuantity;
  }

  /** Getter for active reservations */
  get activeReservations(): Map<string, Reservation> {
    return new Map(this._reservations);
  }

  /** Getter for the aggregate version */
  get version(): number {
    return this._version;
  }

  /**
   * Get available quantity for reservations
   */
  private getAvailableQuantity(): Quantity {
    return this._totalQuantity.subtract(this._reservedQuantity);
  }

  /**
   * Check if a reservation exists and is expired
   */
  private isReservationExpired(reservationId: string): boolean {
    const reservation = this._reservations.get(reservationId);
    if (!reservation || !reservation.expiresAt) {
      return false;
    }
    return reservation.expiresAt <= new Date();
  }

  /**
   * Ensure business invariants are maintained
   */
  private ensureInvariants(): void {
    if (this._totalQuantity.value < 0) {
      throw new Error('Total quantity cannot be negative');
    }
    
    if (this._reservedQuantity.value < 0) {
      throw new Error('Reserved quantity cannot be negative');
    }
    
    if (this._reservedQuantity.value > this._totalQuantity.value) {
      throw new Error('Reserved quantity cannot exceed total quantity');
    }
    
    if (this._reservations.size === 0 && this._reservedQuantity.value > 0) {
      throw new Error('Reserved quantity exists without corresponding reservations');
    }
  }

  /**
   * Convert the StockItem to a plain object for serialization or external use.
   */
  toPrimitives(): StockItemPrimitives {
    return {
      id: this._id.value,
      name: this._name.value,
      availableQuantity: this.availableQuantity.value,
      reservedQuantity: this.reservedQuantity.value,
      totalQuantity: this.totalQuantity.value,
      quantity: this.quantity.value, // Available quantity for backward compatibility
      version: this._version,
    };
  }

  /**
   * Increment version when aggregate is modified
   */
  protected override record(event: DomainEvent): void {
    super.record(event);
    this._version++;
  }
}

/**
 * ReserveStockCommand
 *
 * Command object representing a request to reserve stock from an inventory item.
 *
 * Responsibilities:
 * - Encapsulate all data needed for stock reservation
 * - Provide immutable data structure for the use case
 * - Support optional reservation metadata (expiration, reason)
 */
export class ReserveStockCommand {
  constructor(
    public readonly id: string,                    // Stock item ID to reserve from
    public readonly quantity: number,             // Quantity to reserve
    public readonly reservationId: string,       // Unique reservation identifier
    public readonly expiresAt?: Date,            // Optional expiration date for the reservation
    public readonly reason?: string,             // Optional business reason for the reservation
  ) {}

  /**
   * Create a command from primitive values with validation
   */
  static fromPrimitives(params: {
    id: string;
    quantity: number;
    reservationId: string;
    expiresAt?: Date;
    reason?: string;
  }): ReserveStockCommand {
    if (!params.id || params.id.trim() === '') {
      throw new Error('Stock item ID is required');
    }
    
    if (!params.reservationId || params.reservationId.trim() === '') {
      throw new Error('Reservation ID is required');
    }
    
    if (params.quantity <= 0) {
      throw new Error('Reservation quantity must be greater than zero');
    }
    
    if (params.quantity > 1_000_000) {
      throw new Error('Reservation quantity cannot exceed 1,000,000');
    }

    return new ReserveStockCommand(
      params.id,
      params.quantity,
      params.reservationId,
      params.expiresAt,
      params.reason
    );
  }

  /**
   * Convert command to a plain object for serialization or logging
   */
  toPrimitives(): {
    id: string;
    quantity: number;
    reservationId: string;
    expiresAt?: Date;
    reason?: string;
  } {
    return {
      id: this.id,
      quantity: this.quantity,
      reservationId: this.reservationId,
      ...(this.expiresAt && { expiresAt: this.expiresAt }),
      ...(this.reason && { reason: this.reason }),
    };
  }
}
