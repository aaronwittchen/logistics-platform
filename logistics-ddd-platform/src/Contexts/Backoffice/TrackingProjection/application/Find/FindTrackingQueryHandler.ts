import { TrackingProjectionRepository } from '@/Contexts/Backoffice/TrackingProjection/domain/TrackingProjectionRepository';
import { TrackingView } from '@/Contexts/Backoffice/TrackingProjection/domain/TrackingView';
import { FindTrackingQuery } from './FindTrackingQuery';

export class FindTrackingQueryHandler {
  constructor(private readonly repository: TrackingProjectionRepository) {}

  async handle(query: FindTrackingQuery): Promise<TrackingView | null> {
    return await this.repository.find(query.id);
  }
}
