import dotenv from 'dotenv';

// Load test environment variables first
dotenv.config({ path: '.env.test' });

process.env.NODE_ENV = 'test';

import app from '../src/server/server';

export const testApp = app;
