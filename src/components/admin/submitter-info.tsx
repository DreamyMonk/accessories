'use client';

import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc } from '@/firebase';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';


export function SubmitterInfo({ uid, timestamp }: { uid: string, timestamp: any }) {
  const firestore = useFirestore();
  const userRef = useMemo(() => {
    if (!firestore || !uid) return null;
    return doc(firestore, 'users', uid);
  }, [firestore, uid]);

  const { data: user, loading } = useDoc(userRef);

  const formattedDate = timestamp?.toDate ? formatDistanceToNow(timestamp.toDate(), { addSuffix: true }) : 'some time ago';

  if (loading) {
    return <Skeleton className="h-5 w-40 mt-1" />;
  }

  return (
    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
      {user ? (
        <>
            <Avatar className="h-5 w-5">
                <AvatarImage src={user.photoURL} />
                <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>Submitted by {user.displayName}</span>
        </>
      ) : (
        <span>Submitted by an unknown user</span>
      )}
      <span>&bull;</span>
      <span>{formattedDate}</span>
    </div>
  );
}
