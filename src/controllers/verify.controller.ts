/**
 * Verify Controller
 *
 * Patterns Used:
 *  - Controller Pattern: Encapsulates verification logic in a dedicated controller.
 *  - Middleware Pattern: Uses asyncHandler for cleaner async route handling.
 *  - Validation Pattern: Centralized input validation with Zod schemas.
 *
 * @module controllers/verify.controller
 * @requires express
 * @requires drizzle-orm
 * @requires @/db
 * @requires @/db/schemas
 * @requires @/core/aws/sqs.service
 * @requires @/utils/asyncHandler
 * @requires @/utils/errorHandler
 * @requires @/utils/validations
 * @exports sendVerificationEmailWithValidation - Handler to send verification email with validation
 * @exports verifyAccountWithValidation - Handler to verify account with validation
 */

import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { eq, and } from 'drizzle-orm';
import { sendMessageToQueue } from '@/core/aws/sqs.service';
import { asyncHandler, Response, validate } from '@/utils/asyncHandler';
import { EmailVerificationSchema, verifyOtpSchema } from '@/utils/validations';
import ErrorHandler from '@/utils/errorHandler';
import { users } from '@/db/schemas/user.schema';
import { db } from '@/db';
import { authTokens, otpCodes } from '@/db/schemas';
import type { AuthenticatedRequest } from '@/types/auth-request';
import { verifyUserAccess } from '@/middlewares/verifyUserAccess';

/**
 * Verify Account Handler
 * - Sends a verification OTP to the user's email via SQS
 *
 * Utilizes asyncHandler for automatic error handling and response formatting.
 * Interacts with AWS SQS to enqueue the OTP sending request.
 * @returns Success message indicating OTP has been sent
 * @throws InternalServerError for any failures in sending the message
 * @exports verifyAccountHandler
 */
export const sendVerificationEmail = asyncHandler(async (req: ExpressRequest, _res: ExpressResponse) => {
  const { email, type } = req.body;

  // Check if email exists in the database
  const existingEmail = await db
    .select({
      email: users.email,
    })
    .from(users)
    .where(eq(users.email, email));

  if (existingEmail.length === 0) {
    throw ErrorHandler.NotFound('Email not found');
  }

  // Send message to SQS to trigger OTP email
  await sendMessageToQueue('OTP_QUEUE', { email, type });
  // Respond with success message
  return Response.success(null, 'Verification OTP sent successfully');
});

/**
 * Verify Account with Validation Middleware
 * - Validates request body against EmailVerificationSchema
 * - Calls verifyAccount handler
 *
 * @exports verifyAccountWithValidation
 */
export const sendVerificationEmailWithValidation = [
  validate(data => EmailVerificationSchema.parse(data)),
  sendVerificationEmail,
];

export const verifyAccountHandler = asyncHandler(async (req: ExpressRequest, _res: ExpressResponse) => {
  const { email, otp, type } = req.body;
  // Check if email exists in the database
  const existingEmail = await db
    .select({
      email: users.email,
    })
    .from(users)
    .where(eq(users.email, email));

  if (existingEmail.length === 0) {
    throw ErrorHandler.NotFound('Email not found');
  }
  // Fetch the user id for the email
  const userId = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.email, email))
    .then(res => res[0].id);

  const existingOtp = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.userId, userId), eq(otpCodes.code, otp), eq(otpCodes.type, type)));

  if (existingOtp.length === 0) {
    throw ErrorHandler.BadRequest('Invalid OTP');
  }

  const currentTime = new Date();
  if (existingOtp[0].expiresAt < currentTime) {
    throw ErrorHandler.BadRequest('OTP has expired');
  }

  // If OTP is valid and not expired, proceed to verify the user's account
  await db.update(users).set({ isVerified: true }).where(eq(users.id, userId));

  // Optionally, delete the used OTP
  await db.delete(otpCodes).where(eq(otpCodes.id, existingOtp[0].id));

  return Response.success(null, 'Account verified successfully');
});

export const verifyAccountWithValidation = [validate(data => verifyOtpSchema.parse(data)), verifyAccountHandler];

export const googleVerificationHandler = asyncHandler(async (req: AuthenticatedRequest, _res: ExpressResponse) => {
  verifyUserAccess(req);
  const { email } = req.user!;

  // Build state to include the email (base64 encoded JSON)
  const state = Buffer.from(JSON.stringify({ email, ts: Date.now() })).toString('base64');

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: process.env.GOOGLE_OAUTH_SCOPE,
    access_type: 'offline',
    include_granted_scopes: 'true',
    state,
    prompt: 'consent',
  } as Record<string, string>);

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return Response.success({ url }, 'Google OAuth URL generated');
});

/**
 * Google OAuth callback handler (skeleton)
 * - This endpoint will receive Google redirect with `code` and `state`.
 * - Implementation: exchange `code` for tokens and store tokens in `auth_tokens` table.
 * - Currently returns 501 to indicate not implemented.
 */
export const googleOAuthCallbackHandler = asyncHandler(async (req: ExpressRequest, _res: ExpressResponse) => {
  const code = (req.query.code as string) || (req.body.code as string);
  const state = (req.query.state as string) || (req.body.state as string);

  if (!code) {
    throw ErrorHandler.BadRequest('Authorization code is required');
  }

  if (!state) {
    throw ErrorHandler.BadRequest('Missing state');
  }

  const parsedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8')) as { email?: string };
  // Determine user by email present in state
  const email = parsedState.email as string | undefined;
  if (!email) {
    throw ErrorHandler.BadRequest('Missing email in state');
  }

  const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, email));

  const userId = existingUser[0].id;

  // Exchange authorization code for tokens with Google
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
    code,
    grant_type: 'authorization_code',
    redirect_uri: process.env.GOOGLE_REDIRECT_URI as string,
  });

  let tokenResp;
  try {
    tokenResp = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  } catch (err) {
    // Surface the underlying error message for easier debugging
    throw ErrorHandler.InternalServerError('Failed to contact Google token endpoint', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  if (!tokenResp.ok) {
    const text = await tokenResp.text();
    throw ErrorHandler.InternalServerError('Google token exchange failed', { status: tokenResp.status, body: text });
  }

  const tokenData = (await tokenResp.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    id_token?: string;
    scope?: string;
    token_type?: string;
  };

  if (!tokenData?.access_token) {
    throw ErrorHandler.InternalServerError('Invalid token response from Google');
  }

  const expiresAt = new Date(Date.now() + (tokenData.expires_in ? tokenData.expires_in * 1000 : 3600 * 1000));

  // Persist tokens in auth_tokens table
  try {
    await db.insert(authTokens).values({
      userId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? '',
      provider: 'google',
      expiresAt,
    });

    // mark user as googleConnected
    await db.update(users).set({ googleConnected: true }).where(eq(users.id, userId));
  } catch (err) {
    throw ErrorHandler.DatabaseError('Failed to store auth tokens', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return Response.success({ message: 'Google account connected' }, 'Google OAuth callback handled');
});
