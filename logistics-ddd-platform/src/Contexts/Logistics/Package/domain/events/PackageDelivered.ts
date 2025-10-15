import { DomainEvent, DomainEventPrimitives } from '@/Shared/domain/DomainEvent';
import { Uuid } from '@/Shared/domain/Uuid';

/**
 * PackageDelivered
 *
 * Domain event representing when a package is successfully delivered.
 */
export class PackageDelivered extends DomainEvent {
  static EVENT_NAME = 'logistics.package.delivered';

  constructor(
    params: { aggregateId: Uuid; eventId?: Uuid; occurredOn?: Date },
    public readonly packageId: string,
    public readonly deliveryTimestamp: Date,
  ) {
    super(params);
  }

  public eventName(): string {
    return PackageDelivered.EVENT_NAME;
  }

  protected toPayload() {
    return {
      packageId: this.packageId,
      deliveryTimestamp: this.deliveryTimestamp.toISOString(),
    };
  }

  static fromPrimitives(primitives: DomainEventPrimitives): PackageDelivered {
    const payload = (primitives as DomainEventPrimitives & { attributes?: unknown }).attributes || primitives;
    const eventPrimitives: DomainEventPrimitives = {
      aggregateId: primitives.aggregateId,
      eventId: (primitives as DomainEventPrimitives & { id?: string }).id || primitives.eventId,
      occurredOn: primitives.occurredOn,
      eventName: (primitives as DomainEventPrimitives & { type?: string }).type || primitives.eventName,
      eventVersion: (payload as DomainEventPrimitives & { eventVersion?: string }).eventVersion,
      ...payload,
    };

    return new PackageDelivered(
      {
        aggregateId: Uuid.from(eventPrimitives.aggregateId),
        eventId: Uuid.from(eventPrimitives.eventId),
        occurredOn: new Date(eventPrimitives.occurredOn),
      },
      eventPrimitives.packageId as string,
      new Date(eventPrimitives.deliveryTimestamp as string),
    );
  }
}
