import { DomainEvent } from '../../domain/DomainEvent';

export class EventRegistry {
  private static instance: EventRegistry;
  private events = new Map<string, { eventClass: any; version: string }>();

  static getInstance(): EventRegistry {
    if (!EventRegistry.instance) {
      EventRegistry.instance = new EventRegistry();
    }
    return EventRegistry.instance;
  }

  register<T extends DomainEvent>(
    eventClass: { new (...args: any[]): T; EVENT_NAME: string; fromPrimitives: Function },
    version: string = '1.0.0'
  ): void {
    this.events.set(eventClass.EVENT_NAME, { eventClass, version });
  }

  getEventClass(eventName: string): any {
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