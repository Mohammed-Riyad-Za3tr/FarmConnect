import { Router, type IRouter } from 'express';
import type { Request, Response } from 'express';

const healthRouter: IRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      version: process.env['npm_package_version'] ?? '0.0.1',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    },
  });
});

export { healthRouter };
