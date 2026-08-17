import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      file?: any;
    }
    
    interface Response {
      status(code: number): this;
      json(body: any): this;
      send(body: any): this;
    }
  }
}

export {};