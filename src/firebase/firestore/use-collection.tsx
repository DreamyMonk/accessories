'use client';

import { useState, useEffect } from 'react';
import {
  onSnapshot,
  Query,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
} from 'firebase/firestore';
import { FirestorePermissionError } from '../errors';
import { errorEmitter } from '../error-emitter';

// Create a stable key from a query object to use as a dependency in useEffect.
// This is a workaround for a Firestore SDK issue where rapid subscribe/unsubscribe
// cycles can cause an internal assertion failure.
function getQueryKey(query: Query<any>): string {
  const q = (query as any)._query;
  // We stringify the query's internal representation. This is not a public API
  // but is the most effective way to get a stable key that reflects all
  // query constraints (where, orderBy, limit, etc.).
  return JSON.stringify(q);
}

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<(T & { id: string })[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const queryKey = query ? getQueryKey(query) : null;

  useEffect(() => {
    // If the query is not yet available, do not attempt to subscribe.
    if (!query) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        const docs = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as T & { id: string })
        );
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        const permissionError = new FirestorePermissionError({
          path: (query as any)._query.path.segments.join('/'),
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setLoading(false);
      }
    );

    // This is the cleanup function that React will call when the component
    // unmounts or when the dependencies of the effect change.
    return () => unsubscribe();
  }, [queryKey]); // The effect now correctly depends on the stable query key.

  return { data, loading, error };
}
