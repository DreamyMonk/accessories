'use client';

import {
  collection,
  query,
  where,
  doc,
  runTransaction,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { useCollection, useFirestore } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Check, Clock, X, ThumbsUp, ThumbsDown, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useMemo, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { SubmitterInfo } from './submitter-info';
import { EditSubmissionDialog } from './edit-submission-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type SubmissionStatus = 'pending' | 'approved' | 'rejected';

interface SubmissionsListProps {
  status: SubmissionStatus;
}

const statusConfig = {
    pending: {
        badge: <Badge variant="secondary" className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Pending</Badge>,
    },
    approved: {
        badge: <Badge variant="default" className="bg-green-600 flex items-center gap-1.5"><ThumbsUp className="h-3.5 w-3.5" />Approved</Badge>,
    },
    rejected: {
        badge: <Badge variant="destructive" className="flex items-center gap-1.5"><ThumbsDown className="h-3.5 w-3.5" />Rejected</Badge>,
    }
}


export function SubmissionsList({ status }: SubmissionsListProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [editingContribution, setEditingContribution] = useState<any | null>(null);
  const [deletingContribution, setDeletingContribution] = useState<any | null>(null);

  const contributionsQuery = useMemo(() => {
      if (!firestore) return null;
      return query(
        collection(firestore, 'contributions'),
        where('status', '==', status)
      )
    }, [firestore, status]
  );

  const { data: contributions, loading } = useCollection(contributionsQuery);

  const handleApprove = async (contribution: any) => {
    if (!firestore) {
      toast({ title: 'Error', description: 'Firestore not available.', variant: 'destructive' });
      return;
    }
      
    const contributionRef = doc(firestore, 'contributions', contribution.id);
    
    try {
      await runTransaction(firestore, async (transaction) => {
        // We don't award points to admins
        const isContributorAdmin = contribution.submittedBy === 'admin';
        const userRef = isContributorAdmin ? null : doc(firestore, 'users', contribution.submittedBy);
        const userDoc = userRef ? await transaction.get(userRef) : null;

        const contributorExists = userDoc?.exists();
        const contributorName = contributorExists ? userDoc.data()?.displayName : 'Anonymous';
        
        if (contribution.addToAccessoryId) {
            const accessoryRef = doc(firestore, 'accessories', contribution.addToAccessoryId);
            const accessoryDoc = await transaction.get(accessoryRef);

            if (!accessoryDoc.exists()) {
                throw new Error("Accessory to be updated does not exist.");
            }

            const existingModels = accessoryDoc.data().models || [];
            const newModels = contribution.models.filter((m: string) => !existingModels.includes(m));
            
            if (newModels.length > 0) {
                transaction.update(accessoryRef, {
                    models: [...existingModels, ...newModels],
                    lastUpdated: serverTimestamp(),
                });
            }

             if (contributorExists && userRef) {
                const newPoints = (userDoc.data()?.points || 0) + 5; // Points for adding a model
                transaction.update(userRef, { points: newPoints });
            }

        } else {
            const newAccessoryRef = doc(collection(firestore, "accessories"));
            const newAccessoryData = {
              accessoryType: contribution.accessoryType,
              models: contribution.models,
              source: contribution.source || 'User Contribution',
              lastUpdated: serverTimestamp(),
              contributor: {
                uid: contribution.submittedBy,
                name: contributorName,
                points: isContributorAdmin ? 0 : 10,
              },
            };
            transaction.set(newAccessoryRef, newAccessoryData);

            if (contributorExists && userRef) {
                const newPoints = (userDoc.data()?.points || 0) + 10;
                transaction.update(userRef, { points: newPoints });
            }
        }
        
        transaction.update(contributionRef, { status: 'approved' });
      });

      toast({
        title: 'Approved!',
        description: 'The contribution has been approved and data is now live.',
      });

    } catch (e: any) {
        console.error("Transaction failed: ", e);
        const permissionError = new FirestorePermissionError({
          path: `Transaction failed for contribution ${contribution.id}`,
          operation: 'update',
          requestResourceData: { error: e.message },
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
          title: 'Approval Failed',
          description: e.message || 'Could not approve submission. Check permissions and data.',
          variant: 'destructive',
        });
    }
  };

  const handleReject = async (contribution: any) => {
    if (!firestore) return;
      const contributionRef = doc(firestore, 'contributions', contribution.id);
      try {
        await runTransaction(firestore, async (transaction) => {
          transaction.update(contributionRef, { status: 'rejected' });
        });
        toast({
          title: 'Rejected',
          description: 'The contribution has been rejected.',
        });
      } catch (e: any) {
        const permissionError = new FirestorePermissionError({
          path: contributionRef.path,
          operation: 'update',
          requestResourceData: { status: 'rejected' }
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
          title: 'Rejection failed',
          description: 'Could not reject submission. Please check permissions.',
          variant: 'destructive',
        });
      }
  };

  const handleDelete = async (contributionId: string) => {
    if (!firestore) return;
    const contributionRef = doc(firestore, 'contributions', contributionId);

    deleteDoc(contributionRef)
      .then(() => {
        toast({
          title: 'Submission Deleted',
          description: 'The submission record has been removed.',
        });
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: contributionRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
          title: 'Delete Failed',
          description: 'Could not delete submission. Check permissions.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setDeletingContribution(null);
      })
  }

  if (loading) {
    return (
      <div className="mt-4 grid gap-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!contributions || contributions.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No {status} submissions.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="mt-4 grid gap-4">
        {contributions?.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{c.accessoryType}</CardTitle>
                  <CardDescription>
                    {c.source ? (
                      <a href={c.source} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary break-all">
                        Source Link
                      </a>
                    ) : 'No source provided'}
                  </CardDescription>
                  <SubmitterInfo 
                      uid={c.submittedBy} 
                      timestamp={c.submittedAt}
                  />
                </div>
                {statusConfig[status as SubmissionStatus].badge}
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-semibold mb-2">Compatible Models Submitted:</p>
              <ul className="list-disc list-inside bg-muted/50 p-3 rounded-md text-sm">
                  {c.models.map((model: string) => <li key={model}>{model}</li>)}
              </ul>
              {c.addToAccessoryId && (
                  <p className="text-xs text-muted-foreground mt-2">Suggested addition to an existing group.</p>
              )}
            </CardContent>
             <CardFooter className="flex justify-end gap-2">
                {status === 'pending' && (
                    <>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingContribution(c)}
                        >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleReject(c)}
                        >
                            <X className="mr-2 h-4 w-4" /> Reject
                        </Button>
                        <Button size="sm" onClick={() => handleApprove(c)}>
                            <Check className="mr-2 h-4 w-4" /> Approve
                        </Button>
                    </>
                )}
                {status !== 'pending' && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeletingContribution(c)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                )}
             </CardFooter>
          </Card>
        ))}
      </div>
      
      {editingContribution && (
        <EditSubmissionDialog 
            contribution={editingContribution}
            open={!!editingContribution}
            onOpenChange={(open) => !open && setEditingContribution(null)}
        />
      )}

      {deletingContribution && (
          <AlertDialog open={!!deletingContribution} onOpenChange={(open) => !open && setDeletingContribution(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this submission record.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(deletingContribution.id)}>
                        Yes, delete it
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
      )}
    </>
  );
}
