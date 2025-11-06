import type { Request } from 'express';

/**
 * Enhanced Request interface with authenticated user
 */
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    username: string;
    isVerified: boolean;
    role: string;
  };
}
