"use client";

import { Award, Medal, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";

const mockLeaderboard = [
  { rank: 1, name: "Rahul Sharma", points: 1256, avatar: "https://picsum.photos/seed/1/150/150", imageHint: 'person portrait' },
  { rank: 2, name: "Aisha Khan", points: 1102, avatar: "https://picsum.photos/seed/2/150/150", imageHint: 'person portrait' },
  { rank: 3, name: "Vikram Singh", points: 987, avatar: "https://picsum.photos/seed/3/150/150", imageHint: 'person portrait' },
  { rank: 4, name: "Priya Patel", points: 850, avatar: "https://picsum.photos/seed/4/150/150", imageHint: 'person portrait' },
  { rank: 5, name: "Sandeep Kumar", points: 721, avatar: "https://picsum.photos/seed/5/150/150", imageHint: 'person portrait' },
  { rank: 6, name: "Anjali Gupta", points: 645, avatar: "https://picsum.photos/seed/6/150/150", imageHint: 'person portrait' },
  { rank: 7, name: "Amit Mishra", points: 512, avatar: "https://picsum.photos/seed/7/150/150", imageHint: 'person portrait' },
];

const rankIcons: {[key: number]: React.ReactNode } = {
  1: <Trophy key="1" className="text-yellow-400" />,
  2: <Medal key="2" className="text-slate-400" />,
  3: <Award key="3" className="text-yellow-600" />,
};

export default function LeaderboardPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const topThree = mockLeaderboard.slice(0, 3);
  const rest = mockLeaderboard.slice(3);

  const getOrderedTopThree = () => {
    if (isMobile) {
      return topThree;
    }
    // Desktop order: 2nd, 1st, 3rd
    const [first, second, third] = topThree;
    return [second, first, third];
  };

  const orderedTopThree = getOrderedTopThree();

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
                          <Avatar className="h-24 w-24 border-4 border-card">
                          <AvatarImage src={user.avatar} alt={user.name} data-ai-hint={user.imageHint} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
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
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.name} data-ai-hint={user.imageHint} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
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
