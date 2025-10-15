import { ValueObject } from '@/Shared/domain/ValueObject';

/**
 * Interface representing the properties of TrackingNumber.
 */
interface TrackingNumberProps {
  value: string;
}

/**
 * TrackingNumber
 *
 * A ValueObject representing a shipping tracking number.
 *
 * Responsibilities:
 * - Enforce format validation for tracking numbers
 * - Ensure immutability
 * - Provide type-safe access to the tracking number value
 * - Generate valid tracking numbers
 */
export class TrackingNumber extends ValueObject<TrackingNumberProps> {
  /** Length requirement for tracking numbers */
  private static readonly LENGTH = 10;

  /** Allowed characters for tracking numbers */
  private static readonly ALLOWED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  /**
   * Constructor
   *
   * @param value - the tracking number string
   */
  constructor(value: string) {
    super({ value });
  }

  /**
   * Validation hook
   *
   * Ensures the tracking number follows the required format.
   * Throws an Error if validation fails.
   *
   * @param props - the tracking number properties to validate
   */
  protected validate({ value }: TrackingNumberProps): void {
    if (value.length !== TrackingNumber.LENGTH) {
      throw new Error(`Tracking number must be ${TrackingNumber.LENGTH} characters long`);
    }
    if (!/^[A-Z0-9]+$/.test(value)) {
      throw new Error('Tracking number must contain only uppercase letters and numbers');
    }
  }

  /** Getter for the tracking number value */
  get value(): string {
    return this.props.value;
  }

  /**
   * Generate a new random tracking number
   *
   * @returns a new TrackingNumber instance with a randomly generated value
   */
  static generate(): TrackingNumber {
    let result = '';
    for (let i = 0; i < TrackingNumber.LENGTH; i++) {
      const randomIndex = Math.floor(Math.random() * TrackingNumber.ALLOWED_CHARS.length);
      result += TrackingNumber.ALLOWED_CHARS.charAt(randomIndex);
    }
    return new TrackingNumber(result);
  }

  /**
   * Factory method to create a TrackingNumber
   *
   * @param value - the tracking number string
   * @returns a new TrackingNumber instance
   */
  static from(value: string): TrackingNumber {
    return new TrackingNumber(value);
  }
}
