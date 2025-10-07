import { TrackingProjectionRepository } from '../../domain/TrackingProjectionRepository';
import { TrackingView } from '../../domain/TrackingView';
import { FindTrackingQuery } from './FindTrackingQuery';

export class FindTrackingQueryHandler {
  constructor(private readonly repository: TrackingProjectionRepository) {}

  async handle(query: FindTrackingQuery): Promise<TrackingView | null> {
    return await this.repository.find(query.id);
  }
}