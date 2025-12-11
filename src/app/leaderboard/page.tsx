"use client";

import { Award, Medal, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/components/layout/app-layout";
import { useMemo } from 'react';
import { useIsMobile } from "@/hooks/use-mobile";

const mockLeaderboard = [
  { rank: 1, name: "Rahul Sharma", points: 1256, imageHint: 'person portrait' },
  { rank: 2, name: "Aisha Khan", points: 1102, imageHint: 'person portrait' },
  { rank: 3, name: "Vikram Singh", points: 987, imageHint: 'person portrait' },
  { rank: 4, name: "Priya Patel", points: 850, imageHint: 'person portrait' },
  { rank: 5, name: "Sandeep Kumar", points: 721, imageHint: 'person portrait' },
  { rank: 6, name: "Anjali Gupta", points: 645, imageHint: 'person portrait' },
  { rank: 7, name: "Amit Mishra", points: 512, imageHint: 'person portrait' },
];

export default function LeaderboardPage() {
  const isMobile = useIsMobile();

  const topThree = mockLeaderboard.slice(0, 3);
  const rest = mockLeaderboard.slice(3);

  const orderedTopThree = useMemo(() => {
    if (isMobile === undefined) return []; // Don't render on server or before hydration
    if (isMobile) {
      return topThree;
    }
    // Desktop order: 2nd, 1st, 3rd
    const [first, second, third] = topThree;
    return [second, first, third];
  }, [isMobile, topThree]);

  // Prevent flash of incorrectly ordered items
  if (isMobile === undefined) {
    return (
       <AppLayout>
          <div className="container mx-auto px-4 py-6">
            <div className="text-center mb-8">
              <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">Top Contributors</h1>
              <p className="text-muted-foreground mt-2">Thanks to our community for making AccessoryAce better!</p>
            </div>
          </div>
       </AppLayout>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-8 w-8 text-yellow-500" />;
    if (rank === 2) return <Award className="h-8 w-8 text-slate-400" />;
    if (rank === 3) return <Medal className="h-8 w-8 text-orange-400" />;
    return null;
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">Top Contributors</h1>
          <p className="text-muted-foreground mt-2">Thanks to our community for making AccessoryAce better!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-8 items-end">
          {orderedTopThree.map((user) => {
              return(
                  <Card key={user.rank} className={`transform transition-transform hover:scale-105 ${
                      user.rank === 1 ? 'border-primary border-2 shadow-lg md:-translate-y-4' : ''
                  }`}>
                      <CardContent className="flex flex-col items-center text-center p-6">
                      <div className="relative mb-4">
                          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                            {getRankIcon(user.rank)}
                          </div>
                          <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                          #{user.rank}
                          </div>
                      </div>
                      <p className="font-headline font-semibold text-lg">{user.name}</p>
                      <p className="text-primary font-bold text-xl">{user.points.toLocaleString()} pts</p>
                      </CardContent>
                  </Card>
              )
          })}
        </div>

        <Separator />

        <div className="mt-8 space-y-2">
          {rest.map((user) => (
            <Card key={user.rank} className="hover:bg-card/80">
              <CardContent className="flex items-center p-3 sm:p-4 gap-4">
                <div className="font-bold text-lg w-8 text-center text-muted-foreground">{user.rank}</div>
                <div className="flex-1">
                  <p className="font-semibold">{user.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{user.points.toLocaleString()} pts</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
