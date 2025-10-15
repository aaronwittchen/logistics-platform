import { TrackingView } from './TrackingView';

export interface TrackingProjectionRepository {
  save(tracking: TrackingView): Promise<void>;
  find(id: string): Promise<TrackingView | null>;
  findByStockItemId(stockItemId: string): Promise<TrackingView[]>;
  update(id: string, data: Partial<TrackingView>): Promise<void>;
  delete(id: string): Promise<void>;
  findByStatus(status: TrackingView['status']): Promise<TrackingView[]>;
  findByReservationId(reservationId: string): Promise<TrackingView | null>;
}
