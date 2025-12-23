'use client';

import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useFirestore } from '../provider';
import { useDoc } from './use-doc';

export function useUserDoc(uid?: string) {
  const firestore = useFirestore();

  const userRef = useMemo(() => {
    if (!firestore || !uid) {
      return null;
    }
    return doc(firestore, 'users', uid);
  }, [firestore, uid]);

  return useDoc(userRef);
}
