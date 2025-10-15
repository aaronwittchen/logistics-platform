import { DomainEvent, DomainEventPrimitives } from '@/Shared/domain/DomainEvent';
import { Uuid } from '@/Shared/domain/Uuid';

// Type for domain event constructor
type DomainEventConstructor<T extends DomainEvent = DomainEvent> = {
  new (params: { aggregateId: Uuid; eventId?: Uuid; occurredOn?: Date }, ...args: never[]): T;
  EVENT_NAME: string;
  fromPrimitives(primitives: DomainEventPrimitives): T;
};

export class EventRegistry {
  private static instance: EventRegistry;
  private events = new Map<string, { eventClass: DomainEventConstructor; version: string }>();

  static getInstance(): EventRegistry {
    if (!EventRegistry.instance) {
      EventRegistry.instance = new EventRegistry();
    }
    return EventRegistry.instance;
  }

  register<T extends DomainEvent>(eventClass: DomainEventConstructor<T>, version: string = '1.0.0'): void {
    this.events.set(eventClass.EVENT_NAME, { eventClass, version });
  }

  getEventClass(eventName: string): DomainEventConstructor {
    const eventInfo = this.events.get(eventName);
    if (!eventInfo) {
      throw new Error(`Unknown event type: ${eventName}`);
    }
    return eventInfo.eventClass;
  }

  getEventVersion(eventName: string): string {
    return this.events.get(eventName)?.version || '1.0.0';
  }

  getAllEvents(): Array<{ name: string; version: string }> {
    return Array.from(this.events.entries()).map(([name, info]) => ({
      name,
      version: info.version,
    }));
  }
}
