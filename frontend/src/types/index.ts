export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: string;
  expiresAt: string | null;
  isActive: boolean;
  totalVotes: number;
}

export interface CreatePollInput {
  question: string;
  options: string[];
  expiryHours?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type SocketStatus = 'connected' | 'connecting' | 'disconnected' | 'error';
