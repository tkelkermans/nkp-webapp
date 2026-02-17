import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocket } from './useSocket';

// socket.io-client is mocked in test/setup.tsx
// Get a reference to the mock
import { io } from 'socket.io-client';

describe('useSocket', () => {
  let mockSocket: Record<string, any>;
  let eventHandlers: Record<string, Function>;

  beforeEach(() => {
    eventHandlers = {};
    mockSocket = {
      on: vi.fn((event: string, handler: Function) => {
        eventHandlers[event] = handler;
      }),
      emit: vi.fn(),
      off: vi.fn(),
      disconnect: vi.fn(),
      connected: false,
    };
    vi.mocked(io).mockReturnValue(mockSocket as any);
  });

  it('should start with disconnected status', () => {
    const { result } = renderHook(() => useSocket());
    // Initial state before socket connects
    expect(result.current.isConnected).toBe(false);
  });

  it('should update status on connect', () => {
    const { result } = renderHook(() => useSocket());
    act(() => {
      eventHandlers['connect']?.();
    });
    expect(result.current.status).toBe('connected');
    expect(result.current.isConnected).toBe(true);
  });

  it('should update status on disconnect', () => {
    const { result } = renderHook(() => useSocket());
    act(() => {
      eventHandlers['connect']?.();
    });
    act(() => {
      eventHandlers['disconnect']?.();
    });
    expect(result.current.status).toBe('disconnected');
  });

  it('should handle reconnect_failed', () => {
    const { result } = renderHook(() => useSocket());
    act(() => {
      eventHandlers['reconnect_failed']?.();
    });
    expect(result.current.status).toBe('reconnection_failed');
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useSocket());
    unmount();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
