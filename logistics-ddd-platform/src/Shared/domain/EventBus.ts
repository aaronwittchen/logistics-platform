import { DomainEvent } from "./DomainEvent";

/**
 * Type representing a constructor of a DomainEvent.
 *
 * Useful for subscribing/unsubscribing to events by their class/type.
 *
 * @template T - a subclass of DomainEvent
 */
export type DomainEventClass<T extends DomainEvent = DomainEvent> = new (
  ...args: any[]
) => T;

/**
 * Type for a function that handles a DomainEvent.
 *
 * Can be synchronous or asynchronous (return void or Promise<void>).
 *
 * @template T - the specific DomainEvent type the handler processes
 */
export type DomainEventHandler<T extends DomainEvent = DomainEvent> = (
  event: T
) => void | Promise<void>;

/**
 * Interface representing an Event Bus in the system.
 *
 * Responsible for:
 * - publishing domain events
 * - subscribing handlers to events
 * - unsubscribing handlers from events
 *
 * Allows decoupling of event producers from event consumers.
 */
export interface EventBus {
  /**
   * Publish one or more domain events to all subscribed handlers.
   *
   * @param events - array of DomainEvent instances to publish
   */
  publish(events: DomainEvent[]): Promise<void>;

  /**
   * Subscribe a handler function to a specific type of DomainEvent.
   *
   * @template T - the type of event to listen for
   * @param event - the class of the DomainEvent
   * @param handler - function to call when event is published
   */
  subscribe<T extends DomainEvent>(
    event: DomainEventClass<T>,
    handler: DomainEventHandler<T>
  ): void;

  /**
   * Unsubscribe a previously registered handler from a specific DomainEvent.
   *
   * @template T - the type of event
   * @param event - the class of the DomainEvent
   * @param handler - the handler to remove
   */
  unsubscribe<T extends DomainEvent>(
    event: DomainEventClass<T>,
    handler: DomainEventHandler<T>
  ): void;
}
