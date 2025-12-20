'use client';

import { useUserDoc } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';

export function ContributorInfo({ uid, points }: { uid?: string, points?: number }) {
  const { data: user, loading } = useUserDoc(uid);

  if (loading) {
    return <Skeleton className="h-5 w-40" />;
  }
  
  if (!uid) {
    return null;
  }

  const displayName = user?.displayName || 'Anonymous';
  const displayPoints = points || 0;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
        Contributed by:
        {user?.photoURL && (
            <Avatar className="h-5 w-5">
                <AvatarImage src={user.photoURL} />
                <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
            </Avatar>
        )}
       <span className="font-semibold text-foreground">{displayName}</span> (+{displayPoints} pts)
    </div>
  );
}
