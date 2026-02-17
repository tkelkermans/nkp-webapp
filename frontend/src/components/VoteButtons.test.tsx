import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VoteButtons } from './VoteButtons';
import type { Poll } from '@/types';

const mockPoll: Poll = {
  id: 'test123',
  question: 'Favorite color?',
  options: [
    { id: 'opt1', text: 'Red', votes: 5 },
    { id: 'opt2', text: 'Blue', votes: 3 },
  ],
  createdAt: new Date().toISOString(),
  expiresAt: null,
  isActive: true,
  totalVotes: 8,
};

describe('VoteButtons', () => {
  it('should render all options', () => {
    render(<VoteButtons poll={mockPoll} onVote={vi.fn()} />);
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
  });

  it('should call onVote when clicked', () => {
    const onVote = vi.fn();
    render(<VoteButtons poll={mockPoll} onVote={onVote} />);
    fireEvent.click(screen.getByText('Red'));
    expect(onVote).toHaveBeenCalledWith('opt1');
  });

  it('should disable buttons when hasVoted', () => {
    render(<VoteButtons poll={mockPoll} onVote={vi.fn()} hasVoted />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => expect(btn).toBeDisabled());
  });

  it('should disable buttons when poll is inactive', () => {
    const closedPoll = { ...mockPoll, isActive: false };
    render(<VoteButtons poll={closedPoll} onVote={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => expect(btn).toBeDisabled());
  });

  it('should have aria-labels on buttons', () => {
    render(<VoteButtons poll={mockPoll} onVote={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-label', expect.stringContaining('Red'));
    expect(buttons[0]).toHaveAttribute('aria-label', expect.stringContaining('5'));
  });
});
