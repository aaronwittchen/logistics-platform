import { DomainEvent } from './DomainEvent';

export interface DomainEventSubscriber<T extends DomainEvent> {
  subscribedTo(): Array<{
    EVENT_NAME: string;
    fromPrimitives: (data: any) => T;
  }>;
  on(event: T): Promise<void>;
}