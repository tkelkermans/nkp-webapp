import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';

import { config, validateConfig } from './utils/config.js';
import { initializeRedis, closeRedis } from './models/redis.js';
import { cleanupExpiredPolls } from './models/poll.js';
import { initializeSocket } from './socket/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { metricsMiddleware } from './middleware/metrics.js';
import { specs, swaggerUi } from './swagger.js';
import logger from './utils/logger.js';

import pollsRouter from './routes/polls.js';
import healthRouter from './routes/health.js';
import metricsRouter from './routes/metrics.js';

/**
 * Application Express principale
 */
const app = express();
const httpServer = createServer(app);

// Middleware de sécurité
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", 'ws:', 'wss:'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https://validator.swagger.io'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: config.corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parsing du body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Trust proxy pour les headers X-Forwarded-*
app.set('trust proxy', 1);

// Métriques Prometheus (avant rate limiting pour ne pas être affecté)
app.use(metricsMiddleware);

// Rate limiting global
app.use('/api', apiLimiter);

// Routes API
app.use('/api/health', healthRouter);
app.use('/api/polls', pollsRouter);

// Swagger UI - Documentation API
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'RealTime Poll API Documentation',
}));

// OpenAPI JSON spec
app.get('/api/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// Prometheus metrics (outside /api path, no rate limiting)
app.use('/metrics', metricsRouter);

// Route racine
app.get('/', (_req, res) => {
  res.json({
    name: 'RealTime Poll API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      polls: '/api/polls',
    },
  });
});

// Gestion des erreurs
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Démarre le serveur
 */
async function startServer(): Promise<void> {
  try {
    // Valider la configuration
    validateConfig();

    // Initialiser Redis
    await initializeRedis();

    // Initialiser Socket.io
    initializeSocket(httpServer);

    // Démarrer le nettoyage périodique des sondages expirés
    setInterval(
      () => {
        cleanupExpiredPolls().catch(console.error);
      },
      60 * 60 * 1000 // Toutes les heures
    );

    // Nettoyage initial
    await cleanupExpiredPolls();

    // Démarrer le serveur HTTP
    httpServer.listen(config.port, () => {
      logger.info({
        port: config.port,
        environment: config.nodeEnv,
        healthCheck: `http://localhost:${config.port}/api/health`,
        apiDocs: `http://localhost:${config.port}/api/docs`,
        metrics: `http://localhost:${config.port}/metrics`,
      }, 'RealTime Poll API Server started');
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

/**
 * Gestion de l'arrêt propre
 */
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down gracefully');

  // Fermer le serveur HTTP
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  // Fermer les connexions Redis
  await closeRedis();

  logger.info('Shutdown complete');
  process.exit(0);
}

// Gestionnaires de signaux
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught Exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Rejection');
});

// Démarrer le serveur
startServer();

export { app, httpServer };
