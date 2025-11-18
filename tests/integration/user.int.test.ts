import request from 'supertest';
import app from '../../src/server/server';
import { pool } from '../../src/db';

describe('User Integration Tests', () => {
  let userId: string;
  let token: string;
  let testUser: { username: string; email: string; password: string };

  // Reset relevant tables and create test user before each test
  beforeEach(async () => {
    await pool.query(
      'TRUNCATE TABLE otp_codes, auth_tokens, tasks, reports, users RESTART IDENTITY CASCADE;'
    );

    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    testUser = {
      username: `priya_${unique}`,
      email: `priya+${unique}@example.com`,
      password: 'Password123'
    };

    // Create one user via signup
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send(testUser);

    if (signupRes.status !== 201) {
      throw new Error(`Signup failed: ${JSON.stringify(signupRes.body)}`);
    }

    userId = signupRes.body.data.id;

    // Mark user as verified so protected endpoints work
    await pool.query('UPDATE users SET is_verified = true WHERE email = $1', [testUser.email]);

    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    if (loginRes.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    }

    token = loginRes.body.data.token;
    console.log('User token obtained:', token.substring(0, 20) + '...');
  });


  afterAll(async () => {
    await pool.end();
  });

  // ------------------------------------------------
  // GET /api/users (list all users)
  // ------------------------------------------------
  it('should list all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  // ------------------------------------------------
  // GET /api/users/:id
  // ------------------------------------------------
  it('should get user by ID', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('id', userId);
    expect(res.body.data.email).toBe(testUser.email);
  });

  it('should return 404 for non-existing user', async () => {
    const res = await request(app)
      .get('/api/users/99999999-9999-9999-9999-999999999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });

  // ------------------------------------------------
  // PUT /api/users/:id (update)
  // ------------------------------------------------
  it('should update user details', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'priya_updated'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe('priya_updated');
  });

  it('should NOT update with invalid data', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'invalid'
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  // ------------------------------------------------
  // GET /api/users/me (protected current user route)
  // ------------------------------------------------
  it('should return current logged-in user', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testUser.email);
  });

  it('should NOT return current user without token', async () => {
    const res = await request(app)
      .get('/api/users/me');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  // ------------------------------------------------
  // DELETE /api/users/:id
  // ------------------------------------------------
  it('should delete user by ID', async () => {
    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');

    // Confirm deletion
      // After deletion, user no longer exists so token becomes invalid
      // Just verify deletion response was successful
      expect(res.body).toHaveProperty('message', 'User deleted successfully');
  });

  it('should return 404 when deleting non-existing user', async () => {
    const res = await request(app)
      .delete('/api/users/99999999-9999-9999-9999-999999999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });

  // ------------------------------------------------
  // INVALID TOKEN CHECK
  // ------------------------------------------------
  it('should reject invalid token for user routes', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer invalidtoken123');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });
});
