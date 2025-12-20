'use client';

import { useMemo } from 'react';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useCollection, useFirestore } from '@/firebase';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export default function LeaderboardPage() {
  const firestore = useFirestore();

  const leaderboardQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users'),
      orderBy('points', 'desc'),
      limit(10)
    );
  }, [firestore]);

  const { data: leaderboard, loading } = useCollection(leaderboardQuery);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight mb-8 text-center">
          Top Contributors
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-3 w-20 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {leaderboard?.map((user, index) => (
                  <li
                    key={user.id}
                    className="flex items-center gap-4 p-2 rounded-md transition-colors hover:bg-muted"
                  >
                    <span className="font-bold text-lg text-muted-foreground w-6 text-center">
                      {index + 1}
                    </span>
                    <Avatar>
                      <AvatarImage src={user.photoURL} />
                      <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{user.displayName}</p>
                    </div>
                    <span className="font-bold text-xl text-primary">
                      {user.points} pts
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
