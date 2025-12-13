'use client';

import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, Copy, Share2, ShieldAlert, PlusCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ContributorInfo } from '@/components/search/contributor-info';

export function ResultCard({ result, searchedModel, index }: { result: any, searchedModel: string, index: number }) {
  const [showAll, setShowAll] = useState(false);
  const { toast } = useToast();

  // Find the exact match for searchedModel to ensure correct casing
  const mainModel = result.models.find((m: string) => m.toLowerCase() === searchedModel.toLowerCase()) || searchedModel;
  
  // Exclude the main searched model from the "compatible with" list
  const otherModels = result.models.filter((m: string) => m.toLowerCase() !== searchedModel.toLowerCase());
  
  const topItems = otherModels.slice(0, 5);
  const remainingItems = otherModels.slice(5);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.models.join(', '));
    toast({
      title: "Copied!",
      description: "All compatible models copied to clipboard.",
    });
  };

  return (
    <Card
      className="animate-slide-up-fade"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <CardHeader>
        <div className="flex-1">
          <CardTitle className="font-headline text-xl uppercase tracking-wider">{mainModel}</CardTitle>
          <div className="flex items-center gap-2 mt-1">
             <Badge variant="secondary">{result.accessoryType}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {otherModels.length > 0 ? (
          <>
            <p className="font-semibold mb-2">Also compatible with:</p>
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
          </>
        ) : (
            <p className="text-sm text-muted-foreground">No other compatible models have been added for this group yet.</p>
        )}
      </CardContent>
      <Separator className="my-4" />
      <CardFooter className="flex-col items-start gap-4">
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button variant="secondary" onClick={handleCopy}><Copy className="mr-2 h-4 w-4" /> Copy List</Button>
            <Button variant="outline"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
            <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive"><ShieldAlert className="mr-2 h-4 w-4"/> Report</Button>
             <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Contribute</Button>
        </div>
      </CardFooter>
    </Card>
  );
}
