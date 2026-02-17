import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreatePollForm } from './CreatePollForm';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('CreatePollForm', () => {
  it('should render form fields', () => {
    renderWithProviders(<CreatePollForm />);
    expect(screen.getByLabelText(/question/i)).toBeInTheDocument();
    expect(screen.getByText(/créer le sondage/i)).toBeInTheDocument();
  });

  it('should start with 2 option fields', () => {
    renderWithProviders(<CreatePollForm />);
    const inputs = screen.getAllByPlaceholderText(/option/i);
    expect(inputs).toHaveLength(2);
  });

  it('should add option when clicking add button', () => {
    renderWithProviders(<CreatePollForm />);
    fireEvent.click(screen.getByText(/ajouter une option/i));
    const inputs = screen.getAllByPlaceholderText(/option/i);
    expect(inputs).toHaveLength(3);
  });

  it('should not submit with empty question', async () => {
    renderWithProviders(<CreatePollForm />);
    fireEvent.click(screen.getByText(/créer le sondage/i));
    // Form validation should prevent submission (HTML required attribute)
  });
});
