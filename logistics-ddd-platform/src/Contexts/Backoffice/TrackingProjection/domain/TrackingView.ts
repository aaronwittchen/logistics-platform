export interface TrackingView {
    id: string;
    stockItemId: string;
    stockItemName: string;
    reservedQuantity: number;
    reservationId: string;
    status: 'reserved' | 'registered' | 'in_transit' | 'delivered';
    createdAt: Date;
    updatedAt: Date;
  }