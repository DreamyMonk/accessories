"use client";

import Link from "next/link";
import { HelpCircle, Mail, Trophy } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
        </Link>
        <h1 className="font-headline text-lg font-semibold text-center text-foreground hidden sm:block">
          AccessoryAce
        </h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Help">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Request feature">
            <Mail className="h-5 w-5" />
          </Button>
          <Link href="/leaderboard" legacyBehavior passHref>
            <Button asChild variant="ghost" size="icon" aria-label="Leaderboard">
              <a><Trophy className="h-5 w-5" /></a>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
