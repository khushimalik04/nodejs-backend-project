import request from 'supertest';
import { testApp } from '../setup';

describe('Health Check Integration Tests', () => {
  it('should return healthy status on GET /', async () => {
    const response = await request(testApp).get('/').expect(200);

    expect(response.body).toEqual({
      message: 'Visit API documentation at http://localhost:8080/api-docs',
      status: 'healthy',
    });
  });

  it('should return JSON content type', async () => {
    const response = await request(testApp).get('/').expect(200).expect('Content-Type', /json/);

    expect(response.body.status).toBe('healthy');
  });

  it('should respond quickly (under 1 second)', async () => {
    const startTime = Date.now();

    await request(testApp).get('/').expect(200);

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(1000);
  });
});
