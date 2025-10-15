import { DomainEvent, DomainEventPrimitives } from '@/Shared/domain/DomainEvent';
import { Uuid } from '@/Shared/domain/Uuid';

/**
 * LocationUpdated
 *
 * Domain event representing when a package location is updated during transit.
 */
export class LocationUpdated extends DomainEvent {
  static EVENT_NAME = 'logistics.package.location_updated';

  constructor(
    params: { aggregateId: Uuid; eventId?: Uuid; occurredOn?: Date },
    public readonly packageId: string,
    public readonly newLocation: string,
    public readonly timestamp: Date,
  ) {
    super(params);
  }

  public eventName(): string {
    return LocationUpdated.EVENT_NAME;
  }

  protected toPayload() {
    return {
      packageId: this.packageId,
      newLocation: this.newLocation,
      timestamp: this.timestamp.toISOString(),
    };
  }

  static fromPrimitives(primitives: DomainEventPrimitives): LocationUpdated {
    const payload = (primitives as DomainEventPrimitives & { attributes?: unknown }).attributes || primitives;
    const eventPrimitives: DomainEventPrimitives = {
      aggregateId: primitives.aggregateId,
      eventId: (primitives as DomainEventPrimitives & { id?: string }).id || primitives.eventId,
      occurredOn: primitives.occurredOn,
      eventName: (primitives as DomainEventPrimitives & { type?: string }).type || primitives.eventName,
      eventVersion: (payload as DomainEventPrimitives & { eventVersion?: string }).eventVersion,
      ...payload,
    };

    return new LocationUpdated(
      {
        aggregateId: Uuid.from(eventPrimitives.aggregateId),
        eventId: Uuid.from(eventPrimitives.eventId),
        occurredOn: new Date(eventPrimitives.occurredOn),
      },
      eventPrimitives.packageId as string,
      eventPrimitives.newLocation as string,
      new Date(eventPrimitives.timestamp as string),
    );
  }
}
