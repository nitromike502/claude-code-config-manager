const request = require('supertest');
const app = require('../../src/backend/server');

describe('Security - Input Validation', () => {
  describe('ProjectId Validation', () => {
    test('should reject URL-encoded path traversal (..%2F)', async () => {
      const res = await request(app).get('/api/projects/..%2F..%2Fetc/commands');
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid project ID/);
    });

    test('should reject URL-encoded absolute paths (%2F...)', async () => {
      const res = await request(app).get('/api/projects/%2Fhome%2Fuser/hooks');
      expect(res.status).toBe(400);
    });

    test('should reject path segments with forward slashes', async () => {
      const res = await request(app).get('/api/projects/project/with/slashes/agents');
      expect(res.status).toBe(400);
    });

    test('should accept valid alphanumeric projectId', async () => {
      const res = await request(app).get('/api/projects/validproject123/agents');
      // May be 200 or 404, but should NOT be 400 (validation error)
      expect(res.status).not.toBe(400);
    });

    test('should accept projectId with dashes and underscores', async () => {
      const res = await request(app).get('/api/projects/my-valid_project-123/commands');
      expect(res.status).not.toBe(400);
    });

    test('should reject projectId exceeding 255 characters', async () => {
      const longId = 'a'.repeat(256);
      const res = await request(app).get(`/api/projects/${longId}/agents`);
      expect(res.status).toBe(400);
    });

    // Note: Plain path traversal (../../) is normalized by Express at the HTTP parser level
    // before our middleware runs, so it safely fails routing instead of hitting our endpoints.
    // URL-encoded versions (..%2F) and path segment-based traversal (project/with/slashes)
    // are caught by our validation middleware.
  });
});
