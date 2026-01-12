import pino from 'pino';
import { config } from './config.js';

// Configuration du logger basée sur l'environnement
const isDevelopment = config.nodeEnv === 'development';

export const logger = pino({
  level: process.env['LOG_LEVEL'] || (isDevelopment ? 'debug' : 'info'),
  
  // Format lisible en développement, JSON en production
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,

  // Ajouter des métadonnées communes
  base: {
    service: 'realtime-poll-backend',
    version: '1.0.1',
  },

  // Formater les timestamps en ISO
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Alias pour les niveaux de log courants
export const log = {
  info: (msg: string, data?: object) => logger.info(data, msg),
  warn: (msg: string, data?: object) => logger.warn(data, msg),
  error: (msg: string, data?: object) => logger.error(data, msg),
  debug: (msg: string, data?: object) => logger.debug(data, msg),
};

export default logger;
