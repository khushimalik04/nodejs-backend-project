import request from 'supertest';
import app from '../../src/server/server';
import { pool } from '../../src/db';
import jwt from 'jsonwebtoken';

describe('Auth Integration Tests', () => {
  const testUser = {
    username: 'priya',
    email: 'priya@example.com',
    password: 'Password123'
  };

  // Clean DB before each test
  beforeEach(async () => {
    // Truncate dependent tables to ensure isolation
    await pool.query('TRUNCATE TABLE otp_codes, auth_tokens, tasks, reports, users RESTART IDENTITY CASCADE;');
  });

  afterAll(async () => {
    await pool.end();
  });

  // ---------------------------------------------
  // REGISTER USER
  // ---------------------------------------------
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: testUser.username, email: testUser.email, password: testUser.password });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.email).toBe(testUser.email);
  });

  it('should NOT register if email already exists', async () => {
    await request(app).post('/api/auth/signup').send({ username: testUser.username, email: testUser.email, password: testUser.password });

    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'other', email: testUser.email, password: 'OtherPass123' });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('message');
  });

  // ---------------------------------------------
  // LOGIN
  // ---------------------------------------------
  it('should login an existing user', async () => {
    await request(app).post('/api/auth/signup').send({ username: testUser.username, email: testUser.email, password: testUser.password });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('token');

    const decoded = jwt.decode(res.body.data.token as string) as Record<string, unknown> | null;
    expect(decoded).toBeTruthy();
  });

  it('should NOT login with wrong password', async () => {
    await request(app).post('/api/auth/signup').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrong123'
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  // ---------------------------------------------
  // PROTECTED ROUTE
  // ---------------------------------------------
  it('should access protected logout route with valid token', async () => {
    await request(app).post('/api/auth/signup').send({ username: testUser.username, email: testUser.email, password: testUser.password });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    const token = loginRes.body.data.token as string;

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('should NOT access protected route without token', async () => {
    const res = await request(app)
      .post('/api/auth/logout');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should NOT access protected route with invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer invalidtoken123');

    // authMiddleware returns 401 for invalid token
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });
});
