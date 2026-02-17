import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError } from '@/types';

// Must mock fetch before importing api
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
const { api } = await import('@/lib/api');

describe('ApiClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should fetch polls successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    const polls = await api.getPolls();
    expect(polls).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should throw ApiError on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ success: false, error: 'Not found' }),
    });

    await expect(api.getPoll('nonexistent')).rejects.toThrow(ApiError);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ success: false, error: 'Not found' }),
    });

    await expect(api.getPoll('nonexistent')).rejects.toMatchObject({ status: 404 });
  });

  it('should pass AbortController signal to fetch', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    await api.getPolls();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('should include credentials in requests', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    await api.getPolls();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('should include Content-Type header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    await api.getPolls();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    );
  });

  it('should throw ApiError with status 409 on conflict', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ success: false, error: 'Vous avez déjà voté' }),
    });

    try {
      await api.vote('poll1', 'opt1');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(409);
      expect((error as ApiError).message).toBe('Vous avez déjà voté');
    }
  });
});
