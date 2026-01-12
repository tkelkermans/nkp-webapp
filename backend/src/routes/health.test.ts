import request from 'supertest';
import express from 'express';
import healthRouter from './health.js';

// Créer une app Express minimale pour les tests
const app = express();
app.use('/api/health', healthRouter);

// Mock Redis
const mockPing = jest.fn();

jest.mock('../models/redis.js', () => ({
  default: {
    ping: mockPing,
  },
}));

describe('Health API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return healthy status when Redis is connected', async () => {
      mockPing.mockResolvedValue('PONG');

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.services.redis).toBe('connected');
    });

    it('should return unhealthy status when Redis is disconnected', async () => {
      mockPing.mockRejectedValue(new Error('Connection refused'));

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.data.status).toBe('unhealthy');
      expect(response.body.data.services.redis).toBe('disconnected');
    });
  });

  describe('GET /api/health/ready', () => {
    it('should return OK when Redis is ready', async () => {
      mockPing.mockResolvedValue('PONG');

      const response = await request(app).get('/api/health/ready');

      expect(response.status).toBe(200);
      expect(response.text).toBe('OK');
    });

    it('should return Not Ready when Redis is not ready', async () => {
      mockPing.mockRejectedValue(new Error('Not connected'));

      const response = await request(app).get('/api/health/ready');

      expect(response.status).toBe(503);
      expect(response.text).toBe('Not Ready');
    });
  });

  describe('GET /api/health/live', () => {
    it('should always return OK for liveness', async () => {
      const response = await request(app).get('/api/health/live');

      expect(response.status).toBe(200);
      expect(response.text).toBe('OK');
    });
  });
});
