const request = require('supertest');
const app = require('../../src/backend/server');

describe('API Smoke Tests', () => {
  describe('Health Check', () => {
    test('GET /api/health returns 200 and healthy status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('claude-code-config-manager');
    });
  });

  describe('Project Endpoints', () => {
    test('GET /api/projects returns 200', async () => {
      const response = await request(app).get('/api/projects');
      expect(response.status).toBe(200);
    });

    test('POST /api/projects/scan returns 200', async () => {
      const response = await request(app).post('/api/projects/scan');
      expect(response.status).toBe(200);
    });
  });

  describe('User Endpoints', () => {
    test('GET /api/user/agents returns 200', async () => {
      const response = await request(app).get('/api/user/agents');
      expect(response.status).toBe(200);
    });

    test('GET /api/user/commands returns 200', async () => {
      const response = await request(app).get('/api/user/commands');
      expect(response.status).toBe(200);
    });

    test('GET /api/user/hooks returns 200', async () => {
      const response = await request(app).get('/api/user/hooks');
      expect(response.status).toBe(200);
    });

    test('GET /api/user/mcp returns 200', async () => {
      const response = await request(app).get('/api/user/mcp');
      expect(response.status).toBe(200);
    });
  });

  describe('API Error Handling', () => {
    test('GET /api/nonexistent returns 404', async () => {
      const response = await request(app).get('/api/nonexistent');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
