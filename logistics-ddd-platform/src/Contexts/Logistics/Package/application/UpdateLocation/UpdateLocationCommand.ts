export class UpdateLocationCommand {
  constructor(
    public readonly packageId: string,
    public readonly newLocation: string,
  ) {}
}
