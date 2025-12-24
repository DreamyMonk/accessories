'use client';

import { useMemo } from 'react';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useCollection, useFirestore } from '@/firebase';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Crown, Trophy, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const topThree = leaderboard?.slice(0, 3) || [];
  const rest = leaderboard?.slice(3) || [];

  const PodiumItem = ({ user, rank }: { user: any, rank: 1 | 2 | 3 }) => {
    // Spacer for empty slots if less than 3 users
    if (!user) return <div className="hidden md:flex flex-col flex-1 items-center justify-end h-full min-w-[100px] opacity-0" />;

    const isFirst = rank === 1;
    const isSecond = rank === 2;
    const isThird = rank === 3;

    return (
      <div className={cn(
        "flex flex-col items-center justify-end relative flex-1 min-w-[100px]",
        isFirst ? "order-2 z-20 -mt-8 md:-mt-12" : "", // Push 1st place up
        isSecond ? "order-1 z-10" : "",
        isThird ? "order-3 z-10" : ""
      )}>
        <div className="flex flex-col items-center mb-[-1px] z-20">
          {/* Crown for #1 */}
          {isFirst && (
            <Crown className="w-8 h-8 md:w-10 md:h-10 text-yellow-500 fill-yellow-500 mb-2 animate-bounce" />
          )}

          <div className={cn(
            "relative rounded-full p-1 md:p-1.5 shadow-xl transition-transform hover:scale-105 duration-300",
            isFirst ? "bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-500" : "",
            isSecond ? "bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500" : "",
            isThird ? "bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800" : ""
          )}>
            <Avatar className={cn(
              "border-4 border-background",
              isFirst ? "w-24 h-24 md:w-32 md:h-32" : "w-16 h-16 md:w-24 md:h-24"
            )}>
              <AvatarImage src={user.photoURL} alt={user.displayName} />
              <AvatarFallback className="text-xl font-bold bg-muted">{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            {/* Rank Badge */}
            <div className={cn(
              "absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full font-bold text-white shadow-lg border-2 border-background",
              isFirst ? "bg-yellow-500 w-8 h-8 md:w-10 md:h-10 text-lg md:text-xl" : "w-6 h-6 md:w-8 md:h-8 text-sm md:text-base",
              isSecond ? "bg-slate-500" : "",
              isThird ? "bg-amber-700" : ""
            )}>
              {rank}
            </div>
          </div>

          <div className="mt-6 md:mt-8 text-center space-y-1">
            <p className="font-bold text-sm md:text-lg truncate max-w-[100px] md:max-w-[140px] leading-tight">
              {user.displayName || 'Anonymous'}
            </p>
            <Badge variant="secondary" className="font-mono text-xs bg-background/50 backdrop-blur-sm border-primary/20">
              {user.points} pts
            </Badge>
          </div>
        </div>

        {/* Podium Base */}
        <div className={cn(
          "w-full rounded-t-xl mt-2 relative overflow-hidden backdrop-blur-sm border-x border-t border-white/10",
          isFirst ? "h-36 md:h-48 bg-gradient-to-t from-yellow-500/20 to-yellow-500/5" : "h-24 md:h-32",
          isSecond ? "bg-gradient-to-t from-slate-500/20 to-slate-500/5" : "",
          isThird ? "bg-gradient-to-t from-amber-700/20 to-amber-700/5" : ""
        )}>
          <div className="absolute inset-0 bg-white/5" />
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent inline-block">
            Leadership Board
          </h1>
          <p className="text-muted-foreground text-lg">Top contributors helping the community grow.</p>
        </div>

        {loading ? (
          <div className="space-y-8">
            <div className="flex justify-center items-end gap-4 h-64 pb-8 max-w-lg mx-auto">
              <Skeleton className="w-1/3 h-32 rounded-lg" />
              <Skeleton className="w-1/3 h-48 rounded-lg" />
              <Skeleton className="w-1/3 h-24 rounded-lg" />
            </div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Podium Section */}
            {topThree.length > 0 && (
              <div className="flex justify-center items-end gap-2 md:gap-6 min-h-[300px] max-w-2xl mx-auto px-2">
                {/* 2nd Place */}
                <PodiumItem user={topThree[1]} rank={2} />
                {/* 1st Place */}
                <PodiumItem user={topThree[0]} rank={1} />
                {/* 3rd Place */}
                <PodiumItem user={topThree[2]} rank={3} />
              </div>
            )}

            {/* Remaining List Section */}
            <Card className="border-none shadow-xl bg-gradient-to-b from-background to-muted/20 overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4 border-b">
                <CardTitle className="flex items-center gap-2 text-xl font-headline">
                  <Trophy className="h-5 w-5 text-primary" />
                  Honorable Mentions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {rest.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {rest.map((user, index) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors duration-200 group"
                      >
                        <div className="w-8 text-center font-bold text-muted-foreground flex-shrink-0 font-mono text-sm">
                          #{index + 4}
                        </div>
                        <Avatar className="h-10 w-10 border border-border group-hover:scale-110 transition-transform">
                          <AvatarImage src={user.photoURL} />
                          <AvatarFallback>{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate text-sm md:text-base">{user.displayName || 'AnonymousUser'}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="font-mono text-xs md:text-sm border-primary/20 text-primary bg-primary/5">
                            {user.points} pts
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    {topThree.length === 0 ? "No contributors found yet." : "Join the ranks to see your name here!"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
