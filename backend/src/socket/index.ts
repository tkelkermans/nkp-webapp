import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { redisSub } from '../models/redis.js';
import { config } from '../utils/config.js';
import logger from '../utils/logger.js';
import { websocketConnectionsActive } from '../middleware/metrics.js';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  Poll,
} from '../types/index.js';

let ioInstance: SocketServer<ClientToServerEvents, ServerToClientEvents> | null = null;

/**
 * Configure et initialise Socket.io avec Redis pub/sub
 */
export function initializeSocket(httpServer: HttpServer): SocketServer<
  ClientToServerEvents,
  ServerToClientEvents
> {
  const io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      cors: {
        origin: config.corsOrigin.split(',').map((o) => o.trim()),
        methods: ['GET', 'POST'],
        credentials: true,
      },
      // Configuration pour la stabilité
      pingTimeout: 60000,
      pingInterval: 25000,
      // Transports autorisés
      transports: ['websocket', 'polling'],
    }
  );

  // Gestion des connexions clients
  io.on('connection', (socket) => {
    websocketConnectionsActive.inc();
    logger.debug({ socketId: socket.id }, 'Client connected');

    // Rejoindre une room de sondage
    socket.on('join-poll', (pollId: string) => {
      // Valider l'ID du sondage
      if (!pollId || typeof pollId !== 'string' || pollId.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(pollId)) {
        socket.emit('error', 'ID de sondage invalide');
        return;
      }

      // Quitter les autres rooms de sondage
      const rooms = Array.from(socket.rooms);
      for (const room of rooms) {
        if (room.startsWith('poll:') && room !== `poll:${pollId}`) {
          socket.leave(room);
        }
      }

      socket.join(`poll:${pollId}`);
      logger.debug({ socketId: socket.id, pollId }, 'Client joined poll');
    });

    // Quitter une room de sondage
    socket.on('leave-poll', (pollId: string) => {
      if (!pollId || typeof pollId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(pollId)) {
        return;
      }
      socket.leave(`poll:${pollId}`);
      logger.debug({ socketId: socket.id, pollId }, 'Client left poll');
    });

    // Déconnexion
    socket.on('disconnect', (reason) => {
      websocketConnectionsActive.dec();
      logger.debug({ socketId: socket.id, reason }, 'Client disconnected');
    });

    // Erreur
    socket.on('error', (error) => {
      logger.error({ socketId: socket.id, error }, 'Socket error');
    });
  });

  // Souscrire aux mises à jour Redis
  setupRedisSubscription(io);

  ioInstance = io;
  logger.info('Socket.io initialized');
  return io;
}

/**
 * Gracefully shuts down Socket.io and Redis pub/sub subscriptions
 */
export async function shutdownSocket(): Promise<void> {
  if (ioInstance) {
    // Disconnect all sockets
    const sockets = await ioInstance.fetchSockets();
    for (const socket of sockets) {
      socket.disconnect(true);
    }
    ioInstance.close();
    logger.info('Socket.io shut down');
  }
  // Unsubscribe from Redis pub/sub
  await redisSub.punsubscribe();
  logger.info('Redis pub/sub unsubscribed');
}

/**
 * Configure les abonnements Redis pub/sub
 */
function setupRedisSubscription(
  io: SocketServer<ClientToServerEvents, ServerToClientEvents>
): void {
  // S'abonner aux patterns de mise à jour des sondages
  redisSub.psubscribe('poll:*:updates', 'poll:*:closed');

  redisSub.on('pmessage', (_pattern, channel, message) => {
    try {
      // Extraire l'ID du sondage du canal
      const match = channel.match(/^poll:([^:]+):(updates|closed)$/);
      if (!match) return;

      const [, pollId, eventType] = match;

      if (eventType === 'updates') {
        // Diffuser la mise à jour à tous les clients dans la room
        const poll: Poll = JSON.parse(message);
        io.to(`poll:${pollId}`).emit('vote-update', poll);
        logger.debug({ pollId, eventType }, 'Broadcasted poll update');
      } else if (eventType === 'closed') {
        // Notifier la fermeture du sondage
        io.to(`poll:${pollId}`).emit('poll-closed', pollId!);
        logger.debug({ pollId, eventType }, 'Broadcasted poll close');
      }
    } catch (error) {
      logger.error({ error }, 'Error processing Redis message');
    }
  });

  logger.info('Redis pub/sub subscription active');
}

export default initializeSocket;
