import { DomainEvent } from "./DomainEvent";

/**
 * AggregateRoot
 *
 * Base class for all aggregate roots in a DDD (Domain-Driven Design) system.
 * 
 * An aggregate root:
 * - Is the entry point for a cluster of related entities and value objects
 * - Controls consistency and invariants within the aggregate
 * - Records domain events when important state changes occur
 */
export abstract class AggregateRoot {
  /** Internal list of domain events recorded by this aggregate */
  private domainEvents: DomainEvent[] = [];

  /**
   * Record a new domain event.
   *
   * Use this method inside aggregate methods whenever an important domain event occurs.
   * The event will be stored until pulled by the infrastructure (e.g., EventBus, Event Store).
   *
   * @param event - the domain event to record
   */
  protected record(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  /**
   * Pull all recorded domain events and reset the internal list.
   *
   * This is typically called by the infrastructure layer after saving the aggregate
   * to persist events or publish them to an EventBus.
   *
   * @returns array of DomainEvent instances
   */
  public pullDomainEvents(): DomainEvent[] {
    const events = this.domainEvents;
    this.domainEvents = []; // reset events after pulling
    return events;
  }
}
