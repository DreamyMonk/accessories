'use client';

import { useMemo } from 'react';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';

export function ContributorInfo({ uid, points }: { uid: string, points: number }) {
  const firestore = useFirestore();
  const userRef = useMemo(() => {
    if (!firestore || !uid) return null;
    return doc(firestore, 'users', uid);
  }, [firestore, uid]);

  const { data: user, loading } = useDoc(userRef);

  if (loading) {
    return <Skeleton className="h-5 w-40" />;
  }

  if (!user) {
    return <p className="text-xs text-muted-foreground">Contributed by: Anonymous</p>;
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
        Contributed by:
        <Avatar className="h-5 w-5">
            <AvatarImage src={user.photoURL} />
            <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
        </Avatar>
       <span className="font-semibold text-foreground">{user.displayName}</span> (+{points} pts)
    </div>
  );
}
