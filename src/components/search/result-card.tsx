'use client';

import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, Copy, PlusCircle, Trash2, Pencil, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ContributeToGroupDialog } from '@/components/contribute/contribute-to-group-dialog';
import { ContributorInfo } from './contributor-info';
import { ModelContribution } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResultCard({
  result,
  searchedModel,
  index,
  showContributorInput = false,
  isAdmin = false
}: {
  result: any,
  searchedModel: string,
  index: number,
  showContributorInput?: boolean,
  isAdmin?: boolean
}) {
  const [showAll, setShowAll] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null); // The full model object
  const [newModelName, setNewModelName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const { toast } = useToast();
  const firestore = useFirestore();

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

  const handleDelete = async (modelToDelete: any) => {
    if (!isAdmin || !firestore) return;
    if (!confirm(`Are you sure you want to delete "${getModelName(modelToDelete)}"?`)) return;

    try {
      const ref = doc(firestore, 'accessories', result.id);
      await updateDoc(ref, {
        models: arrayRemove(modelToDelete)
      });
      toast({ title: "Deleted", description: "Model removed from group." });
      // UI update happens via realtime listener in parent
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  const openEdit = (model: any) => {
    setEditingModel(model);
    setNewModelName(getModelName(model));
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!isAdmin || !firestore || !editingModel) return;

    setIsUpdating(true);
    try {
      const ref = doc(firestore, 'accessories', result.id);

      // Remove old, add new. 
      // Note: This loses contributor info if we don't preserve it. We should preserve it.
      const newModelObj = typeof editingModel === 'string'
        ? newModelName
        : { ...editingModel, name: newModelName }; // Preserve other fields like contributorUid/Name

      const batchUpdate = async () => {
        // We can't do exact atomic swap easily in one update call unless we use runTransaction
        // For simplicity/speed in admin, parallel arrayRemove/Union in one update call?
        // No, arrayRemove and arrayUnion in same update works, but if old and new are same? 
        // If name unchanged, do nothing.
        if (getModelName(editingModel) === newModelName) return;

        await updateDoc(ref, {
          models: arrayRemove(editingModel)
        });
        await updateDoc(ref, {
          models: arrayUnion(newModelObj)
        });
      };

      await batchUpdate();
      toast({ title: "Updated", description: "Model updated." });
      setIsEditOpen(false);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };


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

  const AdminActions = ({ model }: { model: any }) => {
    if (!isAdmin || !model) return null;
    return (
      <div className="flex gap-1 ml-2">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(model)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(model)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    )
  };

  return (
    <>
      <Card
        className="animate-slide-up-fade"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <CardHeader>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <CardTitle className="font-headline text-xl uppercase tracking-wider">{mainModelName}</CardTitle>
                <AdminActions model={mainModelObj} />
              </div>
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
                    <AdminActions model={model} />
                  </li>
                ))}
                {showAll && remainingItems.map((model: any, i: number) => (
                  <li key={i} className="flex items-center gap-2 animate-slide-up-fade" style={{ animationDelay: '0ms' }}>
                    <Check className="h-5 w-5 text-green-500" />
                    <span>{getModelName(model)}</span>
                    <ContributorInfo uid={getContributorUid(model)} variant="compact" />
                    <AdminActions model={model} />
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

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Model Name</DialogTitle>
            <DialogDescription>Modify the model name in this compatibility group.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label>Model Name</Label>
            <Input value={newModelName} onChange={(e) => setNewModelName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isUpdating || !newModelName.trim()}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
