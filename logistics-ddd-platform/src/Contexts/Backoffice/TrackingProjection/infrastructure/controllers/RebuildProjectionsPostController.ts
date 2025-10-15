import { Request, Response } from 'express';
import { RebuildProjectionsCommandHandler } from '../../application/RebuildProjections/RebuildProjectionsCommandHandler';
import { RebuildProjectionsCommand } from '../../application/RebuildProjections/RebuildProjectionsCommand';
import { log } from '@/utils/log';

export class RebuildProjectionsPostController {
  constructor(private readonly handler: RebuildProjectionsCommandHandler) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { fromDate } = req.body;

      // Parse date if provided
      const date = fromDate ? new Date(fromDate) : undefined;
      
      if (fromDate && date && isNaN(date.getTime())) {
        res.status(400).json({
          error: 'Invalid date format. Use ISO 8601 format (e.g., 2024-01-15T10:30:00Z)',
        });
        return;
      }

      const command = new RebuildProjectionsCommand(date);
      await this.handler.execute(command);

      res.status(200).json({
        message: 'Projections rebuilt successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      log.err(`Error rebuilding projections: ${error}`);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        error: 'Failed to rebuild projections',
        message: errorMessage,
      });
    }
  }
}