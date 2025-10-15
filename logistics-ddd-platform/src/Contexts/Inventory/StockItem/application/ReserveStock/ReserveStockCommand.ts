export class ReserveStockCommand {
  constructor(
    public readonly id: string,
    public readonly quantity: number,
    public readonly reservationId: string,
    public readonly expiresAt?: Date,
    public readonly reason?: string,
  ) {}
}
