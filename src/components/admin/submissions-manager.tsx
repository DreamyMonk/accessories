'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, LoaderCircle, Pencil, Save, Trash2, Clock } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, deleteDoc, serverTimestamp, addDoc, collection, getDoc, increment, query, where, getDocs } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { addMasterModel } from '@/app/admin/master-models/actions';

// Helper function to format Firestore timestamps safely
const formatDate = (timestamp: any) => {
  if (!timestamp) return 'Unknown';
  try {
    // Handle Firestore Timestamp
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    // Handle standard Date object or string
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

export function SubmissionsManager({ initialSubmissions }: { initialSubmissions: any[] }) {
  const firestore = useFirestore();
  const [submissions, setSubmissions] = useState<any[]>(initialSubmissions);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [editingSubmission, setEditingSubmission] = useState<any | null>(null);
  const { toast } = useToast();

  // keep local state in sync with props if parent updates (e.g. real-time listener)
  useEffect(() => {
    setSubmissions(initialSubmissions);
  }, [initialSubmissions]);

  const handleStatusUpdate = async (submission: any, status: 'approved' | 'rejected') => {
    if (!firestore) return;
    setIsProcessing(submission.id);
    try {
      if (status === 'approved') {
        // 1. Fetch user data to populate contributor info
        let userData: any = { displayName: 'Anonymous', uid: submission.submittedBy };
        if (submission.submittedBy) {
          const userRef = doc(firestore, 'users', submission.submittedBy);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            userData = { ...userData, ...userSnap.data() };
            // Award points!
            await updateDoc(userRef, { points: increment(10) });
          }
        }

        const modelsList: string[] = Array.isArray(submission.models) ? submission.models : [submission.models];

        // 2. Add to Master Models List (Server Action)
        // This ensures future searches will find these models even if they aren't in the global list yet
        for (const model of modelsList) {
          await addMasterModel(model);
        }

        // 3. Find or Create Accessory Document
        // We search for an existing accessory group of this type
        const q = query(
          collection(firestore, 'accessories'),
          where('accessoryType', '==', submission.accessoryType)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Merge into existing document(s) - usually pick the first one matching
          // In a perfect world we might have better grouping, but Type is our grouping key here.
          const existingDoc = querySnapshot.docs[0];
          const existingData = existingDoc.data();
          const existingModels = existingData.models || [];

          // Filter out models that already exist in this accessory group
          const newModelsToAdd = modelsList.filter(newModel =>
            !existingModels.some((em: any) => {
              const emName = typeof em === 'string' ? em : em?.name;
              return typeof emName === 'string' && emName.toLowerCase() === newModel.toLowerCase();
            })
          );

          if (newModelsToAdd.length > 0) {
            const updatedModels = [
              ...existingModels,
              ...newModelsToAdd.map(m => ({
                name: m,
                contributorUid: submission.submittedBy
              }))
            ];

            await updateDoc(doc(firestore, 'accessories', existingDoc.id), {
              models: updatedModels,
              lastUpdated: serverTimestamp()
            });
            toast({ title: "Updated", description: `Added ${newModelsToAdd.length} new models to existing accessory list.` });
          } else {
            toast({ title: "Skipped", description: "All models in this submission are already in the compatibility list." });
          }

        } else {
          // Create New Accessory Document
          const structuredModels = modelsList.map((m: string) => ({
            name: m,
            contributorUid: submission.submittedBy
          }));

          await addDoc(collection(firestore, 'accessories'), {
            accessoryType: submission.accessoryType,
            models: structuredModels,
            contributor: {
              uid: userData.uid || 'anonymous',
              name: userData.displayName || 'Anonymous',
              points: 0
            },
            lastUpdated: serverTimestamp(),
            source: submission.source || ''
          });
          toast({ title: "Created", description: "New accessory compatibility list created." });
        }
      }

      const ref = doc(firestore, 'contributions', submission.id);
      await updateDoc(ref, {
        status,
        reviewedAt: serverTimestamp()
      });

      // Optimistic update
      setSubmissions(prev => prev.map(s => s.id === submission.id ? { ...s, status } : s));


    } catch (error) {
      console.error("Error updating submission:", error);
      toast({ title: "Error", description: "Failed to update submission status.", variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!firestore || !editingSubmission) return;
    setIsProcessing(editingSubmission.id);
    try {
      const ref = doc(firestore, 'contributions', editingSubmission.id);

      // Ensure models is an array
      const modelsArray = typeof editingSubmission.models === 'string'
        ? editingSubmission.models.split(',').map((m: string) => m.trim()).filter(Boolean)
        : editingSubmission.models;

      const updates = {
        accessoryType: editingSubmission.accessoryType,
        models: modelsArray
      };

      await updateDoc(ref, updates);

      setSubmissions(prev => prev.map(s => s.id === editingSubmission.id ? { ...s, ...updates } : s));
      toast({ title: "Success", description: "Submission details updated." });
      setEditingSubmission(null);

    } catch (error) {
      console.error("Error updating details:", error);
      toast({ title: "Error", description: "Failed to update details.", variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (!firestore) return;
    if (!confirm("Are you sure you want to delete this submission permanently?")) return;

    setIsProcessing(submissionId);
    try {
      await deleteDoc(doc(firestore, 'contributions', submissionId));
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
      toast({ title: "Deleted", description: "Submission permanently removed." });
    } catch (error) {
      console.error("Error deleting submission:", error);
      toast({ title: "Error", description: "Failed to delete submission.", variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };

  const renderList = (items: any[], type: 'pending' | 'others') => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Clock className="h-12 w-12 mb-4 opacity-10" />
          <p>No items found.</p>
        </div>
      );
    }

    return (
      <ul className="space-y-3">
        {items.map(submission => {
          const modelsString = Array.isArray(submission.models) ? submission.models.join(', ') : submission.models;
          return (
            <li key={submission.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/50 gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-primary">{submission.accessoryType}</span>
                  <span className="text-muted-foreground">-</span>
                  <span className="font-medium">{modelsString}</span>
                  {type === 'others' && (
                    <Badge variant={submission.status === 'approved' ? 'default' : 'destructive'} className="ml-2 capitalize">
                      {submission.status}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Submitted: {formatDate(submission.submittedAt)}</span>
                  {submission.source && (
                    <a href={submission.source} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                      View Source
                    </a>
                  )}
                  {submission.submittedBy && <span className="text-xs">By: {submission.submittedBy}</span>}
                </div>
              </div>
              {type === 'pending' ? (
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingSubmission({ ...submission, models: modelsString })}
                    disabled={!!isProcessing}
                    title="Edit"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-6 bg-border mx-1" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleStatusUpdate(submission, 'approved')}
                    disabled={!!isProcessing}
                    className="h-8 w-8 border-green-200 hover:bg-green-100 hover:text-green-600 dark:border-green-800 dark:hover:bg-green-900/30"
                    title="Approve"
                  >
                    {isProcessing === submission.id ? <LoaderCircle className="animate-spin h-3 w-3" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleStatusUpdate(submission, 'rejected')}
                    disabled={!!isProcessing}
                    className="h-8 w-8 border-red-200 hover:bg-red-100 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-900/30"
                    title="Reject"
                  >
                    {isProcessing === submission.id ? <LoaderCircle className="animate-spin h-3 w-3" /> : <X className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(submission.id)}
                    disabled={!!isProcessing}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Delete Permanently"
                  >
                    {isProcessing === submission.id ? <LoaderCircle className="animate-spin h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    )
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const approvedSubmissions = submissions.filter(s => s.status === 'approved');
  const rejectedSubmissions = submissions.filter(s => s.status === 'rejected');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Submissions</CardTitle>
        <CardDescription>Review pending, active, and past contributions.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="pending">Pending ({pendingSubmissions.length})</TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:text-green-600">Approved ({approvedSubmissions.length})</TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:text-red-500">Rejected ({rejectedSubmissions.length})</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] w-full rounded-md border">
            <div className="p-4">
              <TabsContent value="pending" className="mt-0">
                {renderList(pendingSubmissions, 'pending')}
              </TabsContent>
              <TabsContent value="approved" className="mt-0">
                {renderList(approvedSubmissions, 'others')}
              </TabsContent>
              <TabsContent value="rejected" className="mt-0">
                {renderList(rejectedSubmissions, 'others')}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={!!editingSubmission} onOpenChange={(open) => !open && setEditingSubmission(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Submission</DialogTitle>
              <DialogDescription>Modify the details before approving.</DialogDescription>
            </DialogHeader>
            {editingSubmission && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Accessory Type</Label>
                  <Input
                    id="type"
                    value={editingSubmission.accessoryType}
                    onChange={(e) => setEditingSubmission({ ...editingSubmission, accessoryType: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="models">Compatible Models (comma separated)</Label>
                  <Input
                    id="models"
                    value={editingSubmission.models}
                    onChange={(e) => setEditingSubmission({ ...editingSubmission, models: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSubmission(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={!!isProcessing}>
                {isProcessing ? <LoaderCircle className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
