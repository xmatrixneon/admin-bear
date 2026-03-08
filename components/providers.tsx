'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { useState, type ReactNode } from 'react';
import { trpc } from '@/lib/trpc';
import type { AdminRouter } from '@/server/routers';

interface TrpcProviderProps {
  children: ReactNode;
}

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // browser should use relative path
    return '';
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // assume localhost
  return 'http://localhost:3000';
}

function getUrl() {
  const base = getBaseUrl();
  return `${base}/api/trpc`;
}

let clientQueryClientSingleton: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          staleTime: 5 * 60 * 1000,
          retry: 1,
          retryDelay: 1000,
        },
        mutations: {
          retry: 1,
        },
      },
    });
  }
  // Browser: use singleton pattern to prevent unnecessary new instances
  return (clientQueryClientSingleton ??= new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
        retry: 1,
        retryDelay: 1000,
      },
      mutations: {
        retry: 1,
      },
    },
  }));
}

/**
 * TrpcProvider Component
 * Wraps the application with tRPC client
 * Provides type-safe API calls with caching and loading states
 */
export function TrpcProvider({ children }: TrpcProviderProps) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: getUrl(),
          transformer: superjson,
          async headers() {
            // Get admin token from localStorage
            if (typeof window !== 'undefined') {
              const token = localStorage.getItem('admin_token');
              if (token) {
                return {
                  'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                };
              }
            }
            return {
              'Content-Type': 'application/json',
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
