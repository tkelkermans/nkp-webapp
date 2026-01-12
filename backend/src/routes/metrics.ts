import { Router, type Request, type Response } from 'express';
import { register } from '../middleware/metrics.js';

const router = Router();

/**
 * @openapi
 * /metrics:
 *   get:
 *     tags:
 *       - Monitoring
 *     summary: Métriques Prometheus
 *     description: Retourne les métriques au format Prometheus pour le scraping
 *     responses:
 *       200:
 *         description: Métriques au format texte Prometheus
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end('Error collecting metrics');
  }
});

export default router;
