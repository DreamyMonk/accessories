"use client";

import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, Copy, QrCode, Share2, ShieldAlert } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const getBrandInitial = (brand: string) => brand.substring(0, 2).toUpperCase();

export function ResultCard({ result, index }: { result: any, index: number }) {
  const [showAll, setShowAll] = useState(false);
  const { toast } = useToast();
  const topItems = result.compatibleModels.slice(0, 5);
  const remainingItems = result.compatibleModels.slice(5);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.compatibleModels.join(', '));
    toast({
      title: "Copied!",
      description: "Compatible models copied to clipboard.",
    });
  };

  return (
    <Card
      className="animate-slide-up-fade"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted font-bold text-lg">
          {getBrandInitial(result.brand)}
        </div>
        <div className="flex-1">
          <CardTitle className="font-headline text-xl uppercase tracking-wider">{result.primaryModel}</CardTitle>
          <div className="flex items-center gap-2 mt-1">
             <Badge variant="secondary">{result.accessoryType}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="font-semibold mb-2">Compatible with:</p>
        <ul className="space-y-2">
          {topItems.map((model: string, i: number) => (
            <li key={i} className={cn("flex items-center gap-2 animate-slide-up-fade")} style={{ animationDelay: `${(index * 100) + (i * 50)}ms` }}>
              <Check className="h-5 w-5 text-green-500" />
              <span>{model}</span>
            </li>
          ))}
          {showAll && remainingItems.map((model: string, i: number) => (
             <li key={i} className="flex items-center gap-2 animate-slide-up-fade" style={{ animationDelay: '0ms' }}>
              <Check className="h-5 w-5 text-green-500" />
              <span>{model}</span>
            </li>
          ))}
        </ul>
        {remainingItems.length > 0 && (
          <Button variant="link" onClick={() => setShowAll(!showAll)} className="p-0 h-auto mt-2">
            {showAll ? 'Show less' : `Show ${remainingItems.length} more`}
          </Button>
        )}
      </CardContent>
      <Separator className="my-4" />
      <CardFooter className="flex-col items-start gap-4">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
           <span>Source: {result.source}</span>
           <span>Updated: {result.lastUpdated}</span>
        </div>
        {result.contributor && (
             <div className="text-xs text-muted-foreground">
                Contributed by: <span className="font-semibold text-foreground">{result.contributor.name}</span> (+{result.contributor.points} pts)
             </div>
        )}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button variant="outline" onClick={handleCopy}><Copy className="mr-2 h-4 w-4" /> Copy</Button>
            <Button variant="outline"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
            <Button variant="outline"><QrCode className="mr-2 h-4 w-4" /> QR</Button>
            <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive"><ShieldAlert className="mr-2 h-4 w-4"/> Report</Button>
        </div>
      </CardFooter>
    </Card>
  );
}
