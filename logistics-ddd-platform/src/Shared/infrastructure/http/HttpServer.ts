import express, { type Express, type Request, type Response, type NextFunction, type Router } from 'express';
import type { Server } from 'http';
import { swaggerUi, specs } from '../swagger';
import { log } from '@/utils/log';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type RouteHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

export interface RouteDefinition {
  method: HttpMethod;
  path: string;
  handler: RouteHandler;
}

export class HttpServer {
  private readonly app: Express;
  private server?: Server;
  private readonly port: number;

  constructor(port: number = 3000) {
    this.app = express();
    this.app.use(express.json());
    this.port = port;

    // Add Swagger middleware
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
    log.info(`Swagger docs available at: http://localhost:${this.port}/api-docs`);
  }

  public async start(): Promise<void> {
    return this.listen(this.port);
  }

  public use(middleware: (req: Request, res: Response, next: NextFunction) => void): void {
    this.app.use(middleware);
  }

  public registerRoutes(routes: RouteDefinition[]): void {
    for (const r of routes) {
      this.app[r.method](r.path, (req, res, next) => void Promise.resolve(r.handler(req, res, next)).catch(next));
    }
  }

  public registerRouter(router: Router): void {
    this.app.use(router);
  }

  public get(path: string, handler: RouteHandler): void {
    this.registerRoutes([{ method: 'get', path, handler }]);
  }

  public post(path: string, handler: RouteHandler): void {
    this.registerRoutes([{ method: 'post', path, handler }]);
  }

  public listen(port: number, host = '0.0.0.0'): Promise<void> {
    return new Promise(resolve => {
      this.server = this.app.listen(port, host, () => resolve());
    });
  }

  public async close(): Promise<void> {
    const srv = this.server;
    if (!srv) return;
    await new Promise<void>((resolve, reject) => srv.close(err => (err ? reject(err) : resolve())));
    this.server = undefined;
  }

  public express(): Express {
    return this.app;
  }
}
