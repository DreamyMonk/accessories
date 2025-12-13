'use client';

import { useState, useEffect, useRef } from 'react';
import {
  onSnapshot,
  Query,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
} from 'firebase/firestore';
import { FirestorePermissionError } from '../errors';
import { errorEmitter } from '../error-emitter';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<(T & { id: string })[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
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
          path: query.path,
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
  }, [query]); // The effect now correctly depends on the query object.

  return { data, loading, error };
}
