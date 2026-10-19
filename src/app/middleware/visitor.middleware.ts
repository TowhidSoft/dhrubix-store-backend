// middleware/visitor.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { VisitorService } from '../modules/visitor/visitor.service';

export const autoTrackVisitor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip API calls and static files
    if (req.path.startsWith('/api/v1') ||
      req.path.includes('.') ||
      req.method !== 'POST' ||
      req.path === '/api/v1/visitors/track') {
      return next();
    }

    // Get or create session ID from cookie
    let sessionId = req.cookies?.visitorSessionId;

    if (!sessionId) {
      sessionId = randomUUID();
      // Set cookie for 30 days
      res.cookie('visitorSessionId', sessionId, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }

    // Extract userId if user is authenticated
    const userId = (req as any).user?.id;

    // Track visitor (async - don't block the request)
    VisitorService.trackVisitor({
      sessionId,
      userId
    }).catch(error => {
      console.error('Visitor tracking error:', error);
    });

  } catch (error) {
    // Don't block the request if tracking fails
    console.error('Visitor middleware error:', error);
  }

  next();
};