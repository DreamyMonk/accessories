'use client';

import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, Copy, PlusCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ContributeToGroupDialog } from '@/components/contribute/contribute-to-group-dialog';
import { ContributorInfo } from './contributor-info';
import { ModelContribution } from '@/lib/types';

export function ResultCard({
  result,
  searchedModel,
  index,
  showContributorInput = false
}: {
  result: any,
  searchedModel: string,
  index: number,
  showContributorInput?: boolean
}) {
  const [showAll, setShowAll] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const getModelName = (model: any): string => {
    if (!model) return '';
    if (typeof model === 'string') return model;
    if (typeof model === 'object' && model.name) {
      return String(model.name);
    }
    return '';
  }

  const getContributorUid = (model: any): string | undefined => {
    if (typeof model === 'object' && model !== null) return model.contributorUid;
    return undefined;
  }

  const mainModelObj = result.models.find((m: any) => {
    const name = getModelName(m);
    return typeof name === 'string' && name.toLowerCase() === searchedModel.toLowerCase();
  });
  const mainModelName = mainModelObj ? getModelName(mainModelObj) : searchedModel;
  const mainModelContributor = mainModelObj ? getContributorUid(mainModelObj) : result.contributor.uid;

  const otherModels = result.models.filter((m: any) => {
    const name = getModelName(m);
    return typeof name === 'string' && name.toLowerCase() !== searchedModel.toLowerCase();
  });

  const topItems = otherModels.slice(0, 5);
  const remainingItems = otherModels.slice(5);

  const handleCopy = () => {
    const modelList = result.models.map(getModelName).join(', ');
    navigator.clipboard.writeText(modelList);
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
          <div className="flex items-center gap-2">
            <CardTitle className="font-headline text-xl uppercase tracking-wider">{mainModelName}</CardTitle>
            <ContributorInfo uid={mainModelContributor} variant="compact" />
          </div>
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
              {topItems.map((model: any, i: number) => (
                <li key={i} className={cn("flex items-center gap-2 animate-slide-up-fade")} style={{ animationDelay: `${(index * 100) + (i * 50)}ms` }}>
                  <Check className="h-5 w-5 text-green-500" />
                  <span>{getModelName(model)}</span>
                  <ContributorInfo uid={getContributorUid(model)} variant="compact" />
                </li>
              ))}
              {showAll && remainingItems.map((model: any, i: number) => (
                <li key={i} className="flex items-center gap-2 animate-slide-up-fade" style={{ animationDelay: '0ms' }}>
                  <Check className="h-5 w-5 text-green-500" />
                  <span>{getModelName(model)}</span>
                  <ContributorInfo uid={getContributorUid(model)} variant="compact" />
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
        <div className="w-full grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={handleCopy}><Copy className="mr-2 h-4 w-4" /> Copy List</Button>
          <Button variant="outline" onClick={() => setIsDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Contribute</Button>
        </div>
        <Separator className="my-4" />
        <ContributorInfo uid={result.contributor?.uid} points={result.contributor?.points} />
        <ContributeToGroupDialog result={result} open={isDialogOpen} onOpenChange={setIsDialogOpen} showContributorInput={showContributorInput} />
      </CardFooter>
    </Card>
  );
}
