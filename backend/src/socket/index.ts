import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { redisSub } from '../models/redis.js';
import { config } from '../utils/config.js';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  Poll,
} from '../types/index.js';

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
    console.log(`🔌 Client connected: ${socket.id}`);

    // Rejoindre une room de sondage
    socket.on('join-poll', (pollId: string) => {
      // Valider l'ID du sondage
      if (!pollId || typeof pollId !== 'string' || pollId.length > 50) {
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
      console.log(`📊 Client ${socket.id} joined poll: ${pollId}`);
    });

    // Quitter une room de sondage
    socket.on('leave-poll', (pollId: string) => {
      socket.leave(`poll:${pollId}`);
      console.log(`📊 Client ${socket.id} left poll: ${pollId}`);
    });

    // Déconnexion
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
    });

    // Erreur
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });
  });

  // Souscrire aux mises à jour Redis
  setupRedisSubscription(io);

  console.log('✅ Socket.io initialized');
  return io;
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
        console.log(`📢 Broadcasted update for poll: ${pollId}`);
      } else if (eventType === 'closed') {
        // Notifier la fermeture du sondage
        io.to(`poll:${pollId}`).emit('poll-closed', pollId!);
        console.log(`📢 Broadcasted close for poll: ${pollId}`);
      }
    } catch (error) {
      console.error('❌ Error processing Redis message:', error);
    }
  });

  console.log('✅ Redis pub/sub subscription active');
}

export default initializeSocket;
