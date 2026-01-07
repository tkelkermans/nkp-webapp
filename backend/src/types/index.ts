/**
 * Types et interfaces pour l'application de sondage en temps réel
 */

// Interface pour une option de sondage
export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

// Interface pour un sondage complet
export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: string;
  expiresAt: string | null;
  isActive: boolean;
  totalVotes: number;
  creatorId?: string;
}

// Données pour créer un nouveau sondage
export interface CreatePollInput {
  question: string;
  options: string[];
  expiryHours?: number;
}

// Données pour voter
export interface VoteInput {
  optionId: string;
  voterId: string; // Hash basé sur IP + User-Agent
}

// Réponse après un vote
export interface VoteResult {
  success: boolean;
  poll: Poll;
  message?: string;
}

// Événements Socket.io
export interface ServerToClientEvents {
  'vote-update': (poll: Poll) => void;
  'poll-closed': (pollId: string) => void;
  'error': (message: string) => void;
}

export interface ClientToServerEvents {
  'join-poll': (pollId: string) => void;
  'leave-poll': (pollId: string) => void;
}

// Données stockées dans Redis
export interface RedisPollData {
  id: string;
  question: string;
  options: string; // JSON stringified PollOption[]
  createdAt: string;
  expiresAt: string | null;
  isActive: string; // "true" | "false"
}

// Configuration de l'application
export interface AppConfig {
  port: number;
  nodeEnv: string;
  redisUrl: string;
  corsOrigin: string;
  sessionSecret: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  pollExpiryHours: number;
  maxOptionsPerPoll: number;
}

// Réponse API standard
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Erreur personnalisée
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
