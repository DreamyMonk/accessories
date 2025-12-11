"use client";

import Link from "next/link";
import { LogIn, UserPlus, LayoutDashboard, Trophy } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useUser } from "@/firebase";

export function Header() {
  const { user, loading } = useUser();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
        </Link>
        <h1 className="font-headline text-lg font-semibold text-center text-foreground hidden sm:block">
          AccessoryAce
        </h1>
        <div className="flex items-center gap-2">
          {!loading &&
            (user ? (
              <>
                <Button asChild variant="ghost">
                  <Link href="/profile">
                    <LayoutDashboard className="h-5 w-5 sm:mr-2" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">
                    <LogIn className="h-5 w-5 sm:mr-2" />
                    <span className="hidden sm:inline">Login</span>
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/register">
                    <UserPlus className="h-5 w-5 sm:mr-2" />
                    <span className="hidden sm:inline">Sign Up</span>
                  </Link>
                </Button>
              </>
            ))}
            <Link href="/leaderboard" passHref>
                <Button variant="ghost" size="icon" aria-label="Leaderboard">
                    <Trophy className="h-5 w-5" />
                </Button>
            </Link>
        </div>
      </div>
    </header>
  );
}
