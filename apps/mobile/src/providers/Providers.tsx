import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const client = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });
export function Providers({ children }: React.PropsWithChildren) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
