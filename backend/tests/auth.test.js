/**
 * Basic smoke tests — run with: npm test
 * Requires a running database and migrated schema.
 */
const request = require('supertest');
const app = require('../src/app');

describe('Auth API', () => {
  const email = `test_${Date.now()}@example.com`;
  const password = 'password123';

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email, password });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it('should reject invalid login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'wrong' });
    expect(res.statusCode).toBe(401);
  });
});
