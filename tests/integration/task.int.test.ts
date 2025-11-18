import request from 'supertest';
import app from '../../src/server/server';
import { pool } from '../../src/db';

describe('Task Integration Tests', () => {
  let token: string;
  let testUser: { username: string; email: string; password: string };

  // Create a fresh test user before each test
  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE otp_codes, auth_tokens, tasks, reports, users RESTART IDENTITY CASCADE;');

    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    testUser = {
      username: `priya_${unique}`,
      email: `priya+${unique}@example.com`,
      password: 'Password123'
    };

    // Register user
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send(testUser);

    if (signupRes.status !== 201) {
      console.error('Signup error:', signupRes.body);
      throw new Error(`Signup failed: ${JSON.stringify(signupRes.body)}`);
    }

    const userId = signupRes.body.data.id;
    console.log('User created with ID:', userId);

    // Mark user as verified
    await pool.query('UPDATE users SET is_verified = true WHERE id = $1', [userId]);

    // Login user - verify exact email is being used
    console.log('Attempting login with email:', testUser.email);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    if (loginRes.status !== 200) {
      console.error('Login error:', loginRes.body);
      throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    }

    token = loginRes.body.data.token;
  });


  afterAll(async () => {
    await pool.end();
  });

  // ---------------------------------------------
  // CREATE TASK
  // ---------------------------------------------
  it('should create a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'New Task',
        description: 'Integration Testing Task'
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.title).toBe('New Task');
  });

  it('should NOT create a task without a title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Missing title'
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  // ---------------------------------------------
  // GET TASKS
  // ---------------------------------------------
  it('should fetch all tasks for logged-in user', async () => {
    // Create 2 tasks
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task 1', description: 'Test 1' });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task 2', description: 'Test 2' });

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  it('should NOT fetch tasks without token', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  // ---------------------------------------------
  // GET SINGLE TASK
  // ---------------------------------------------
  it('should fetch a single task by id', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Single Task', description: 'Details' });

    const taskId = createRes.body.data.id;

    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Single Task');
  });

  it('should return 404 for non-existent task', async () => {
    const res = await request(app)
      .get('/api/tasks/99999999-9999-9999-9999-999999999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  // ---------------------------------------------
  // UPDATE TASK
  // ---------------------------------------------
  it('should update a task', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Old Title' });

    const id = createRes.body.data.id;

    const res = await request(app)
      .put(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');
  });

  it('should NOT update a task belonging to another user', async () => {
    // Create task with user1
    const task = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'User1 Task' });

    const id = task.body.data.id;

    // Register user2
    const unique2 = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const user2 = {
      username: `user2_${unique2}`,
      email: `user2+${unique2}@example.com`,
      password: 'Test1234'
    };

    const signup2 = await request(app).post('/api/auth/signup').send(user2);
    if (signup2.status !== 201) {
      throw new Error(`User2 signup failed: ${JSON.stringify(signup2.body)}`);
    }

    // Mark user2 as verified
    await pool.query('UPDATE users SET is_verified = true WHERE email = $1', [user2.email]);

    // Login user2
    const login2 = await request(app).post('/api/auth/login').send({
      email: user2.email,
      password: user2.password
    });

    const token2 = login2.body.data.token;

    // User2 tries to update User1's task
    const res = await request(app)
      .put(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ title: 'Hacked' });

    expect(res.status).toBe(403);
  });

  // ---------------------------------------------
  // DELETE TASK
  // ---------------------------------------------
  it('should delete a task', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Delete Task' });

    const id = createRes.body.data.id;

    const res = await request(app)
      .delete(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('should NOT delete a non-existent task', async () => {
    const res = await request(app)
      .delete('/api/tasks/99999999-9999-9999-9999-999999999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
