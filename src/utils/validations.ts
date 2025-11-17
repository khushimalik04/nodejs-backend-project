import { z } from 'zod';
import { isISTFormat } from './helpers';

/**
 * User-related validation schemas
 */
export const SignupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * Login Schema
 * - Validates user login credentials
 */
export const LoginSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * Task-related validation schemas
 */
export const CreateTaskSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(255, 'Title must not exceed 255 characters').trim(),
    description: z.string().max(2000, 'Description must not exceed 2000 characters').optional().nullable(),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
    startTime: z
      .string()
      .refine(
        val => {
          if (!val) {
            return true;
          }
          return isISTFormat(val);
        },
        {
          message:
            'Invalid start time format. Use ISO 8601 format: YYYY-MM-DDTHH:mm:ssZ (e.g., 2025-11-18T09:00:00Z for 9 AM IST)',
        },
      )
      .optional()
      .nullable(),
    endTime: z
      .string()
      .refine(
        val => {
          if (!val) {
            return true;
          }
          return isISTFormat(val);
        },
        {
          message:
            'Invalid end time format. Use ISO 8601 format: YYYY-MM-DDTHH:mm:ssZ (e.g., 2025-11-18T17:00:00Z for 5 PM IST)',
        },
      )
      .optional()
      .nullable(),
    calendarEventId: z.string().max(255, 'Calendar event ID too long').optional().nullable(),
  })
  .refine(
    data => {
      if (data.startTime && data.endTime) {
        return new Date(data.startTime) < new Date(data.endTime);
      }
      return true;
    },
    {
      message: 'Start time must be before end time',
      path: ['startTime'],
    },
  );

/**
 * Update Task Schema
 * - All fields are optional for partial updates
 */
export const UpdateTaskSchema = CreateTaskSchema.partial();

/**
 * Task Query Parameters Schema
 * - For validating query parameters in task listing endpoints
 */
export const TaskQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  search: z.string().min(1).max(100).optional(),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'startTime']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
});

/**
 * Task Params Schema
 * - For validating route parameters like task ID
 */
export const TaskParamsSchema = z.object({
  id: z.uuid('Invalid task ID format'),
});

/**
 * Verify OTP Schema
 * - For validating OTP verification requests
 */
export const EmailVerificationSchema = z.object({
  email: z.email(),
  type: z.enum(['email_verification', 'reset_password']),
});

/**
 * Verify OTP Schema
 * - For validating resend OTP requests
 */
export const verifyOtpSchema = z.object({
  email: z.email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  type: z.enum(['email_verification', 'reset_password']),
});
