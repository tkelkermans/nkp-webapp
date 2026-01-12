import request from 'supertest';
import express from 'express';
import pollsRouter from './polls.js';

// Créer une app Express minimale pour les tests
const app = express();
app.use(express.json());
app.use('/api/polls', pollsRouter);

// Mock Redis pour les tests
jest.mock('../models/redis.js', () => ({
  default: {
    hset: jest.fn().mockResolvedValue('OK'),
    hgetall: jest.fn().mockResolvedValue({}),
    pipeline: jest.fn().mockReturnValue({
      hset: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    }),
    zrangebyscore: jest.fn().mockResolvedValue([]),
    sismember: jest.fn().mockResolvedValue(0),
    hincrby: jest.fn().mockResolvedValue(1),
    sadd: jest.fn().mockResolvedValue(1),
  },
  redisPub: {
    publish: jest.fn().mockResolvedValue(1),
  },
}));

describe('Polls API', () => {
  describe('POST /api/polls', () => {
    it('should create a poll with valid input', async () => {
      const response = await request(app)
        .post('/api/polls')
        .send({
          question: 'What is your favorite color?',
          options: ['Red', 'Blue', 'Green'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.question).toBe('What is your favorite color?');
      expect(response.body.data.options).toHaveLength(3);
    });

    it('should reject poll with less than 2 options', async () => {
      const response = await request(app)
        .post('/api/polls')
        .send({
          question: 'Invalid poll',
          options: ['Only one'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject poll with empty question', async () => {
      const response = await request(app)
        .post('/api/polls')
        .send({
          question: '',
          options: ['A', 'B'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject poll with too many options', async () => {
      const response = await request(app)
        .post('/api/polls')
        .send({
          question: 'Too many options',
          options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/polls', () => {
    it('should return list of active polls', async () => {
      const response = await request(app).get('/api/polls');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/polls/:id', () => {
    it('should return 404 for non-existent poll', async () => {
      const response = await request(app).get('/api/polls/nonexistent123');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid poll ID format', async () => {
      const response = await request(app).get('/api/polls/ab'); // Too short

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/polls/:id/vote', () => {
    it('should reject vote without optionId', async () => {
      const response = await request(app)
        .post('/api/polls/testpollid1/vote')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject vote with invalid optionId', async () => {
      const response = await request(app)
        .post('/api/polls/testpollid1/vote')
        .send({ optionId: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
