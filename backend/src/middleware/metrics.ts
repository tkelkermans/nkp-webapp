import { Counter, Histogram, Gauge, Registry, collectDefaultMetrics } from 'prom-client';
import type { Request, Response, NextFunction } from 'express';

// Créer un registre personnalisé
export const register = new Registry();

// Collecter les métriques par défaut (CPU, mémoire, etc.)
collectDefaultMetrics({ register });

// Métriques personnalisées

// Compteur total de requêtes HTTP
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

// Histogramme de durée des requêtes HTTP
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// Compteur de votes
export const pollVotesTotal = new Counter({
  name: 'poll_votes_total',
  help: 'Total number of votes cast',
  registers: [register],
});

// Compteur de sondages créés
export const pollsCreatedTotal = new Counter({
  name: 'polls_created_total',
  help: 'Total number of polls created',
  registers: [register],
});

// Gauge pour les connexions WebSocket actives
export const websocketConnectionsActive = new Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

// Gauge pour les sondages actifs
export const pollsActive = new Gauge({
  name: 'polls_active',
  help: 'Number of active polls',
  registers: [register],
});

/**
 * Middleware pour collecter les métriques HTTP
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Ignorer les requêtes de métriques elles-mêmes
  if (req.path === '/metrics') {
    next();
    return;
  }

  const startTime = Date.now();

  // Intercepter la fin de la réponse
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const path = normalizePath(req.route?.path || req.path);

    httpRequestsTotal.inc({
      method: req.method,
      path,
      status: res.statusCode,
    });

    httpRequestDuration.observe(
      { method: req.method, path },
      duration
    );
  });

  next();
}

/**
 * Normalise les chemins pour éviter la cardinalité élevée
 * Ex: /api/polls/abc123 -> /api/polls/:id
 */
function normalizePath(path: string): string {
  return path
    .replace(/\/[a-zA-Z0-9_-]{6,}(?=\/|$)/g, '/:id')
    .replace(/\/\d+(?=\/|$)/g, '/:id');
}
