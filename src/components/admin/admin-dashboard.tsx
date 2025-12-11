'use client';

import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { useCollection, useFirestore } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Check, Clock, X } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export function AdminDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const contributionsQuery = firestore
    ? query(
        collection(firestore, 'contributions'),
        where('status', '==', 'pending')
      )
    : null;

  const { data: contributions, loading, error } = useCollection(contributionsQuery);

  const handleApprove = async (id: string, contribution: any) => {
    if (!firestore) return;
    try {
      const { status, submittedAt, ...accessoryData } = contribution;

      // Add to main accessories collection
      await addDoc(collection(firestore, 'accessories'), {
        ...accessoryData,
        lastUpdated: serverTimestamp(),
        // In a real app, you'd associate this with the user who contributed it
        contributor: {
          name: 'Community User',
          points: 10,
        },
      });

      // Update the status of the contribution
      const contributionRef = doc(firestore, 'contributions', id);
      await updateDoc(contributionRef, { status: 'approved' });

      toast({
        title: 'Approved!',
        description: 'The contribution has been added to the main database.',
      });
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'Could not approve the contribution.',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (id: string) => {
    if (!firestore) return;
    try {
      const contributionRef = doc(firestore, 'contributions', id);
      // You could also update the status to 'rejected' if you want to keep a record
      await deleteDoc(contributionRef);
      toast({
        title: 'Rejected',
        description: 'The contribution has been removed.',
        variant: 'destructive',
      });
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'Could not reject the contribution.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-headline font-bold">Admin Dashboard</h1>
      <p className="text-muted-foreground">
        Review and approve new data contributions from the community.
      </p>

      <div className="mt-8">
        <h2 className="text-2xl font-headline font-semibold">
          Pending Submissions
        </h2>

        {loading && (
          <div className="mt-4 grid gap-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {!loading && contributions?.length === 0 && (
          <Card className="mt-4">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No pending submissions.</p>
            </CardContent>
          </Card>
        )}

        <div className="mt-4 grid gap-4">
          {contributions?.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{c.accessoryType}</CardTitle>
                    <CardDescription>
                      <a href={c.source} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                        Source
                      </a>
                    </CardDescription>
                  </div>
                   <Badge variant="secondary" className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Pending
                    </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-semibold mb-2">Compatible Models:</p>
                <ul className="list-disc list-inside bg-muted/50 p-3 rounded-md">
                    {c.compatibleModels.map((model: string) => <li key={model}>{model}</li>)}
                </ul>
                <div className="mt-4 flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleReject(c.id)}
                  >
                    <X className="mr-2 h-4 w-4" /> Reject
                  </Button>
                  <Button size="sm" onClick={() => handleApprove(c.id, c)}>
                    <Check className="mr-2 h-4 w-4" /> Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
