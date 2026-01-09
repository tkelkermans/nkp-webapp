'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 10 * 1000, retry: 2, refetchOnWindowFocus: false },
          mutations: { retry: 1 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: { background: '#1f2937', color: '#fff', borderRadius: '12px', padding: '12px 20px' },
        }}
      />
    </QueryClientProvider>
  );
}

export default Providers;
