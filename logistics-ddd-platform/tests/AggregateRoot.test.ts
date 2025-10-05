import { describe, expect, test } from "bun:test";
import { AggregateRoot } from "../src/Shared/domain/AggregateRoot";
import { DomainEvent } from "../src/Shared/domain/DomainEvent";
import { Uuid } from "../src/Shared/domain/Uuid";

class SomethingHappened extends DomainEvent<{ value: number }> {
  constructor(params: { aggregateId: Uuid; eventId?: Uuid; occurredOn?: Date }, private readonly value: number) {
    super(params);
  }
  eventName(): string {
    return "something.happened";
  }
  protected toPayload() {
    return { value: this.value };
  }
}

class Counter extends AggregateRoot {
  private count = 0;
  constructor(private readonly id: Uuid) {
    super();
  }
  increment(): void {
    this.count += 1;
    this.record(new SomethingHappened({ aggregateId: this.id }, this.count));
  }
}

describe("AggregateRoot", () => {
  test("records and pulls domain events", () => {
    const id = Uuid.random();
    const aggregate = new Counter(id);
    aggregate.increment();
    aggregate.increment();

    const events = aggregate.pullDomainEvents();
    expect(events.length).toBe(2);
    expect(events[0].eventName()).toBe("something.happened");
    expect(events[1].eventName()).toBe("something.happened");

    // After pulling, buffer is cleared
    expect(aggregate.pullDomainEvents().length).toBe(0);
  });
});


