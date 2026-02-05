import 'express';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user: any;
    }
  }
}
