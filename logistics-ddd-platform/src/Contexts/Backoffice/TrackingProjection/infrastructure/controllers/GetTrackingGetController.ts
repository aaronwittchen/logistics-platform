import { Request, Response } from 'express';
import { FindTrackingQueryHandler } from '../../application/Find/FindTrackingQueryHandler';
import { FindTrackingQuery } from '../../application/Find/FindTrackingQuery';
import { log } from '@/utils/log';

export class GetTrackingGetController {
  constructor(private readonly handler: FindTrackingQueryHandler) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate required parameter
      if (!id) {
        res.status(400).json({ error: 'Tracking ID is required' });
        return;
      }

      const query = new FindTrackingQuery(id);
      const tracking = await this.handler.handle(query);

      if (!tracking) {
        res.status(404).json({ error: 'Tracking not found' });
        return;
      }

      res.status(200).json(tracking);
    } catch (error: any) {
      log.err(`Error in GetTrackingGetController: ${error}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}