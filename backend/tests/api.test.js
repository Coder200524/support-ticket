// =============================================
// backend/tests/api.test.js
// =============================================
// Supertest API Tests
//
// WHAT IS SUPERTEST?
// Supertest is a library that allows us to test our Express
// application WITHOUT actually starting a server on a port.
// It directly passes requests into the Express app object.
// =============================================

const request = require('supertest');
const app = require('../src/app');

describe('Health Check API', () => {
  it('should return 200 OK and success message', async () => {
    // 1. Arrange & Act: Send a GET request to /api/health
    const response = await request(app).get('/api/health');

    // 2. Assert: Check the results
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('running');
  });
});

describe('Authentication API', () => {
  it('should fail login with empty credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: '', password: '' }); // Missing required fields

    // Should return 422 Unprocessable Entity due to validation failure
    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Validation failed');
  });

  it('should fail login with invalid email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'password123' });

    expect(response.status).toBe(422);
  });
});
