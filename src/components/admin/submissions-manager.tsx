'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, LoaderCircle, Pencil, Save } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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

  const handleStatusUpdate = async (submissionId: string, status: 'approved' | 'rejected') => {
    if (!firestore) return;
    setIsProcessing(submissionId);
    try {
      const ref = doc(firestore, 'contributions', submissionId);
      await updateDoc(ref, {
        status,
        reviewedAt: serverTimestamp()
      });

      setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, status } : s));

      toast({
        title: `Submission ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        description: status === 'approved' ? "Contribution accepted." : "Contribution rejected."
      });

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

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Submissions</CardTitle>
        <CardDescription>Review, edit, and approve pending model submissions.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full rounded-md border">
          <div className="p-4">
            {pendingSubmissions.length > 0 ? (
              <ul className="space-y-3">
                {pendingSubmissions.map(submission => {
                  const modelsString = Array.isArray(submission.models) ? submission.models.join(', ') : submission.models;
                  return (
                    <li key={submission.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/50 gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-primary">{submission.accessoryType}</span>
                          <span className="text-muted-foreground">-</span>
                          <span className="font-medium">{modelsString}</span>
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
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingSubmission({ ...submission, models: modelsString })} // Flatten models to string for editing
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
                          onClick={() => handleStatusUpdate(submission.id, 'approved')}
                          disabled={!!isProcessing}
                          className="h-8 w-8 border-green-200 hover:bg-green-100 hover:text-green-600 dark:border-green-800 dark:hover:bg-green-900/30"
                          title="Approve"
                        >
                          {isProcessing === submission.id ? <LoaderCircle className="animate-spin h-3 w-3" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleStatusUpdate(submission.id, 'rejected')}
                          disabled={!!isProcessing}
                          className="h-8 w-8 border-red-200 hover:bg-red-100 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-900/30"
                          title="Reject"
                        >
                          {isProcessing === submission.id ? <LoaderCircle className="animate-spin h-3 w-3" /> : <X className="h-4 w-4" />}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Check className="h-12 w-12 mb-4 opacity-10" />
                <p>No pending submissions.</p>
              </div>
            )}
          </div>
        </ScrollArea>

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
