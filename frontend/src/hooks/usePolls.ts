'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Poll, CreatePollInput } from '@/types';

export function usePolls() {
  return useQuery({
    queryKey: ['polls'],
    queryFn: () => api.getPolls(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function usePoll(id: string) {
  return useQuery({
    queryKey: ['poll', id],
    queryFn: () => api.getPoll(id),
    enabled: !!id,
    staleTime: 10 * 1000,
  });
}

export function useCreatePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePollInput) => api.createPoll(input),
    onSuccess: (newPoll) => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      queryClient.setQueryData(['poll', newPoll.id], newPoll);
    },
  });
}

export function useVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pollId, optionId }: { pollId: string; optionId: string }) =>
      api.vote(pollId, optionId),
    onSuccess: (updatedPoll) => {
      queryClient.setQueryData(['poll', updatedPoll.id], updatedPoll);
    },
  });
}

export function useUpdatePollCache() {
  const queryClient = useQueryClient();
  return (poll: Poll) => {
    queryClient.setQueryData(['poll', poll.id], poll);
  };
}
