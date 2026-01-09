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

import pollsRouter from './routes/polls.js';
import healthRouter from './routes/health.js';

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

// Rate limiting global
app.use('/api', apiLimiter);

// Routes API
app.use('/api/health', healthRouter);
app.use('/api/polls', pollsRouter);

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
      console.log('');
      console.log('🗳️  RealTime Poll API Server');
      console.log('================================');
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📡 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/api/health`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Gestion de l'arrêt propre
 */
async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  // Fermer le serveur HTTP
  httpServer.close(() => {
    console.log('✅ HTTP server closed');
  });

  // Fermer les connexions Redis
  await closeRedis();

  console.log('✅ Shutdown complete');
  process.exit(0);
}

// Gestionnaires de signaux
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Démarrer le serveur
startServer();

export { app, httpServer };
