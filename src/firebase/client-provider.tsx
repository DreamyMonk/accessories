'use client';

import { ReactNode, useMemo } from 'react';
import { initializeFirebase } from './init';
import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const firebaseContextValue = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider value={firebaseContextValue}>{children}</FirebaseProvider>
  );
}
