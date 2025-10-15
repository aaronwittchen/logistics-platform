import { DomainEvent, DomainEventPrimitives } from './DomainEvent';

export interface DomainEventSubscriber<T extends DomainEvent> {
  subscribedTo(): Array<{
    EVENT_NAME: string;
    fromPrimitives: (data: DomainEventPrimitives) => T;
  }>;
  on(event: T): Promise<void>;
}
