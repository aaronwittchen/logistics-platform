import { ValueObject } from "../../src/Shared/domain/ValueObject";

export class TestValueObject<T extends object> extends ValueObject<T> {
  constructor(props: T) {
    super(props);
  }
}


