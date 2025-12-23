'use client';

import { useAuth, useUser, useFirestore } from '@/firebase';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Clock, ThumbsUp, ThumbsDown, X, Check, ArrowLeft, PlusCircle } from 'lucide-react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
import { useCollection } from '@/firebase';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

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
        if (!firestore || !user?.uid) return null;
        return query(
            collection(firestore, 'contributions'),
            where('submittedBy', '==', user.uid),
            orderBy('submittedAt', 'desc')
        );
    }, [firestore, user?.uid]);

    const { data: contributions, loading: contributionsLoading } = useCollection(contributionsQuery);

    const loading = userLoading || contributionsLoading;

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <LoaderCircle className="h-12 w-12 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <h1 className="text-2xl font-bold">Please sign in to view your contributions.</h1>
                <Button asChild>
                    <Link href="/login">Sign In</Link>
                </Button>
            </div>
        );
    }

    return (
        <AppLayout>
            <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href="/profile">
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-3xl font-headline font-bold">My Contributions</h1>
                                <p className="text-muted-foreground">Manage and track your submissions.</p>
                            </div>
                        </div>
                        <Button asChild>
                            <Link href="/contribute">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Contribution
                            </Link>
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {contributions && contributions.length > 0 ? (
                            contributions.map((contribution: any) => {
                                const status = contribution.status as SubmissionStatus;
                                const config = statusConfig[status] || statusConfig.pending;

                                return (
                                    <Card key={contribution.id} className="transition-all hover:shadow-md">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                                        {contribution.accessoryType}
                                                    </CardTitle>
                                                    <CardDescription className="mt-1">
                                                        Submitted {contribution.submittedAt?.toDate ? formatDistanceToNow(contribution.submittedAt.toDate(), { addSuffix: true }) : 'Just now'}
                                                    </CardDescription>
                                                </div>
                                                {config.badge}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground mb-1">Compatible Models</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {contribution.models?.map((model: string) => (
                                                            <Badge key={model} variant="outline">{model}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                {contribution.source && (
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground mb-1">Source URL</p>
                                                        <a
                                                            href={contribution.source}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-primary hover:underline truncate block"
                                                        >
                                                            {contribution.source}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                            {contribution.rejectionReason && status === 'rejected' && (
                                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                                                    <p className="text-sm font-medium text-red-800 dark:text-red-300">Rejection Reason:</p>
                                                    <p className="text-sm text-red-600 dark:text-red-400">{contribution.rejectionReason}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            <Card className="text-center py-12">
                                <CardContent>
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="bg-muted p-3 rounded-full">
                                            <FileText className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-lg">No contributions yet</h3>
                                            <p className="text-muted-foreground max-w-sm mx-auto">
                                                You haven't submitted any accessory compatibility data yet. Start contributing to help the community!
                                            </p>
                                        </div>
                                        <Button asChild className="mt-4">
                                            <Link href="/contribute">
                                                Start Contributing
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function FileText({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
            <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
    )
}
