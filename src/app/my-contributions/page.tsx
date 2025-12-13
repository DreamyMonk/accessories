'use client';

import { useMemo } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle, PlusCircle, Check, Clock, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

type SubmissionStatus = 'pending' | 'approved' | 'rejected';

const statusConfig = {
    pending: {
        badge: <Badge variant="secondary" className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Pending</Badge>,
        icon: <Clock className="h-5 w-5 text-muted-foreground" />,
    },
    approved: {
        badge: <Badge variant="default" className="bg-green-600 flex items-center gap-1.5"><ThumbsUp className="h-3.5 w-3.5" />Approved</Badge>,
        icon: <Check className="h-5 w-5 text-green-500" />,
    },
    rejected: {
        badge: <Badge variant="destructive" className="flex items-center gap-1.5"><ThumbsDown className="h-3.5 w-3.5" />Rejected</Badge>,
        icon: <X className="h-5 w-5 text-destructive" />,
    }
};

export default function MyContributionsPage() {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();

    const contributionsQuery = useMemo(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'contributions'),
            where('submittedBy', '==', user.uid),
            orderBy('submittedAt', 'desc')
        );
    }, [firestore, user]);

    const { data: contributions, loading: contributionsLoading } = useCollection(contributionsQuery);

    const isLoading = userLoading || contributionsLoading;

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="container mx-auto px-4 py-6 space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            );
        }

        if (!user) {
            return (
                <div className="container mx-auto px-4 py-6">
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">My Contributions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-4">You need to be signed in to see your contributions.</p>
                            <Button asChild>
                                <Link href="/login">Sign In</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }
        
        if (!contributions || contributions.length === 0) {
             return (
                <div className="container mx-auto px-4 py-6 text-center">
                    <Card className="max-w-md mx-auto">
                         <CardHeader>
                            <CardTitle className="font-headline">No Contributions Yet</CardTitle>
                            <CardDescription>
                                Help the community and earn points by adding new accessory data.
                            </CardDescription>
                         </CardHeader>
                         <CardContent>
                            <Button asChild>
                                <Link href="/contribute">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Make Your First Contribution
                                </Link>
                            </Button>
                         </CardContent>
                    </Card>
                </div>
             )
        }

        return (
            <div className="container mx-auto px-4 py-6">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-headline font-bold">My Contributions</h1>
                        <p className="text-muted-foreground">Track the status of all your submissions.</p>
                    </div>
                     <Button asChild variant="outline">
                        <Link href="/contribute"><PlusCircle className="mr-2 h-4 w-4" /> Add New</Link>
                    </Button>
                </div>
                <div className="space-y-4">
                    {contributions.map(c => (
                        <Card key={c.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="font-headline">{c.brand} {c.accessoryType}</CardTitle>
                                        <CardDescription>
                                            Submitted {c.submittedAt ? formatDistanceToNow(c.submittedAt.toDate(), { addSuffix: true }) : ''}
                                        </CardDescription>
                                    </div>
                                    {statusConfig[c.status as SubmissionStatus].badge}
                                </div>
                            </CardHeader>
                             <CardContent>
                                <p className="font-semibold mb-2">Compatible Models Submitted:</p>
                                <ul className="list-disc list-inside bg-muted/50 p-3 rounded-md text-sm">
                                    {c.models.map((model: string) => <li key={model}>{model}</li>)}
                                </ul>
                                {c.source && (
                                    <div className="mt-3 text-sm">
                                        <span className="font-semibold">Source: </span>
                                        <a href={c.source} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{c.source}</a>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <AppLayout>
            {renderContent()}
        </AppLayout>
    );
}
