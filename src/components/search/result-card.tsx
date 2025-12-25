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
import { doc, updateDoc, arrayRemove, arrayUnion, deleteDoc } from 'firebase/firestore';
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

  // Defensive check: If result or models are missing, don't render.
  // This prevents crashes if the database has malformed documents.
  if (!result || !result.models || !Array.isArray(result.models)) {
    return null;
  }

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

  const getContributorName = (model: any): string | undefined => {
    if (typeof model === 'object' && model !== null) return model.contributorName;
    return undefined;
  }

  const handleDeleteGroup = async () => {
    if (!isAdmin || !firestore) return;
    if (confirm("Are you sure you want to delete this entire compatibility group? This action cannot be undone.")) {
      try {
        const docRef = doc(firestore, 'accessories', result.id);
        await deleteDoc(docRef);
        toast({ title: "Group Deleted", description: "The accessory group has been permanently removed." });
      } catch (e) {
        toast({ title: "Error", description: "Failed to delete group.", variant: "destructive" });
      }
    }
  };

  const handleDelete = async (modelToDelete: any) => {
    if (!isAdmin || !firestore) return;
    if (!confirm(`Are you sure you want to delete "${getModelName(modelToDelete)}"?`)) return;

    try {
      const ref = doc(firestore, 'accessories', result.id);
      await updateDoc(ref, {
        models: arrayRemove(modelToDelete)
      });
      toast({ title: "Deleted", description: "Model removed from group." });
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

      const newModelObj = typeof editingModel === 'string'
        ? newModelName
        : { ...editingModel, name: newModelName };

      const batchUpdate = async () => {
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
          <div className="flex justify-between items-start">
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
            {isAdmin && (
              <Button variant="destructive" size="sm" onClick={handleDeleteGroup} className="ml-4">
                Delete Group
              </Button>
            )}
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
                    {getContributorName(model) && (
                      <span className="text-xs text-muted-foreground">(by {getContributorName(model)})</span>
                    )}
                    <ContributorInfo uid={getContributorUid(model)} variant="compact" />
                    <AdminActions model={model} />
                  </li>
                ))}
                {showAll && remainingItems.map((model: any, i: number) => (
                  <li key={i} className="flex items-center gap-2 animate-slide-up-fade" style={{ animationDelay: '0ms' }}>
                    <Check className="h-5 w-5 text-green-500" />
                    <span>{getModelName(model)}</span>
                    {getContributorName(model) && (
                      <span className="text-xs text-muted-foreground">(by {getContributorName(model)})</span>
                    )}
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
        <CardFooter>
          <div className="flex w-full gap-2">
            <Button variant="outline" className="flex-1" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              Copy List
            </Button>
            <Button className="flex-1" onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Contribute
            </Button>
          </div>
        </CardFooter>
      </Card>

      <ContributeToGroupDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        accessoryId={result.id}
        accessoryType={result.accessoryType}
        existingModels={result.models.map(getModelName)}
      />

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Model</DialogTitle>
            <DialogDescription>
              Update the model name. This changes it for all searches.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid gap-2">
              <Label htmlFor="modelName">Model Name</Label>
              <Input
                id="modelName"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder="Enter model name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
