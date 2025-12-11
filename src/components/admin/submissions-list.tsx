'use client';

import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { useCollection, useFirestore, useDoc } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Check, Clock, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useMemo } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';

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

  const contributionsQuery = useMemo(() => {
      if (!firestore) return null;
      return query(
        collection(firestore, 'contributions'),
        where('status', '==', status)
      )
    }, [firestore, status]
  );

  const { data: contributions, loading } = useCollection(contributionsQuery);

  const handleApprove = async (id: string, contribution: any) => {
    if (!firestore) return;
      const { status, submittedAt, submittedBy, ...accessoryData } = contribution;
      const accessoryCollectionRef = collection(firestore, 'accessories');
      const userRef = doc(firestore, 'users', submittedBy);

      try {
        await runTransaction(firestore, async (transaction) => {
          const newAccessoryRef = doc(accessoryCollectionRef);
          transaction.set(newAccessoryRef, {
            ...accessoryData,
            lastUpdated: serverTimestamp(),
            contributor: {
              uid: submittedBy,
              points: 10,
            },
          });

          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) {
            throw "User document does not exist!";
          }
          const newPoints = (userDoc.data().points || 0) + 10;
          transaction.update(userRef, { points: newPoints });
          
          const contributionRef = doc(firestore, 'contributions', id);
          transaction.update(contributionRef, { status: 'approved' });
        });

        toast({
          title: 'Approved!',
          description: 'The contribution has been added and user points awarded.',
        });

      } catch (e) {
          const permissionError = new FirestorePermissionError({
            path: 'transaction',
            operation: 'create',
            requestResourceData: { contribution, error: (e as Error).message },
          });
          errorEmitter.emit('permission-error', permissionError);
          toast({
            title: 'Approval Failed',
            description: 'Something went wrong during the approval process.',
            variant: 'destructive',
          });
      }
  };

  const handleReject = async (id: string) => {
    if (!firestore) return;
      const contributionRef = doc(firestore, 'contributions', id);
      updateDoc(contributionRef, { status: 'rejected' }).catch(serverError => {
        const permissionError = new FirestorePermissionError({
          path: contributionRef.path,
          operation: 'update',
          requestResourceData: { status: 'rejected' }
        });
        errorEmitter.emit('permission-error', permissionError);
      });
      toast({
        title: 'Rejected',
        description: 'The contribution has been rejected.',
        variant: 'destructive',
      });
  };

  if (loading) {
    return (
      <div className="mt-4 grid gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
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
                <SubmitterInfo 
                    uid={c.submittedBy} 
                    timestamp={c.submittedAt}
                />
              </div>
               {statusConfig[status as SubmissionStatus].badge}
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-semibold mb-2">Compatible Models:</p>
            <ul className="list-disc list-inside bg-muted/50 p-3 rounded-md">
                {c.compatibleModels.map((model: string) => <li key={model}>{model}</li>)}
            </ul>
            {status === 'pending' && (
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
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


function SubmitterInfo({ uid, timestamp }: { uid: string, timestamp: any }) {
  const firestore = useFirestore();
  const userRef = useMemo(() => {
    if (!firestore || !uid) return null;
    return doc(firestore, 'users', uid);
  }, [firestore, uid]);

  const { data: user, loading } = useDoc(userRef);

  const formattedDate = timestamp?.toDate ? formatDistanceToNow(timestamp.toDate(), { addSuffix: true }) : 'some time ago';

  if (loading) {
    return <Skeleton className="h-5 w-40 mt-1" />;
  }

  return (
    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
      {user ? (
        <>
            <Avatar className="h-5 w-5">
                <AvatarImage src={user.photoURL} />
                <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>Submitted by {user.displayName}</span>
        </>
      ) : (
        <span>Submitted by an unknown user</span>
      )}
      <span>&bull;</span>
      <span>{formattedDate}</span>
    </div>
  );
}
