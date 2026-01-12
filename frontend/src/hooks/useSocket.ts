'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Poll, SocketStatus } from '@/types';

// Socket.io: connect to same origin
// Works in both dev (nginx proxy) and prod (K8s Ingress)

interface UseSocketOptions {
  pollId?: string;
  onVoteUpdate?: (poll: Poll) => void;
  onPollClosed?: (pollId: string) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { pollId, onVoteUpdate, onPollClosed } = options;
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const socketRef = useRef<Socket | null>(null);
  const currentPollRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setStatus('connecting');
    // Connect to same origin (nginx in dev, Ingress in prod routes /socket.io to backend)
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('connected');
      if (currentPollRef.current) socket.emit('join-poll', currentPollRef.current);
    });

    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('connect_error', () => setStatus('error'));
    socket.on('vote-update', (poll: Poll) => onVoteUpdate?.(poll));
    socket.on('poll-closed', (closedPollId: string) => onPollClosed?.(closedPollId));

    return () => {
      if (currentPollRef.current) socket.emit('leave-poll', currentPollRef.current);
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pollId || !socketRef.current) return;
    const socket = socketRef.current;

    if (currentPollRef.current && currentPollRef.current !== pollId) {
      socket.emit('leave-poll', currentPollRef.current);
    }

    if (socket.connected) socket.emit('join-poll', pollId);
    currentPollRef.current = pollId;

    return () => {
      if (socket.connected && currentPollRef.current) {
        socket.emit('leave-poll', currentPollRef.current);
      }
    };
  }, [pollId]);

  const joinPoll = useCallback((id: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-poll', id);
      currentPollRef.current = id;
    }
  }, []);

  const leavePoll = useCallback((id: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-poll', id);
      if (currentPollRef.current === id) currentPollRef.current = null;
    }
  }, []);

  return { status, isConnected: status === 'connected', joinPoll, leavePoll };
}

export default useSocket;
