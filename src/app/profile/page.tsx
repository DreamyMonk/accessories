'use client';

import { useAuth, useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { signOut } from 'firebase/auth';
import { LoaderCircle, LogOut, PlusCircle, FileText, ThumbsUp, Clock, ThumbsDown, X, Check, Settings, User, Activity, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { doc, setDoc, collection, query, where, orderBy, limit, increment, onSnapshot } from 'firebase/firestore';
import { useMemo, useEffect, useState } from 'react';
import { useDoc, useCollection } from '@/firebase';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Separator } from '@/components/ui/separator';

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

export default function ProfilePage() {
    const auth = useAuth();
    const firestore = useFirestore();
    const { user, loading: userAuthLoading } = useUser();
    const { toast } = useToast();

    // Consolidated State
    const [userData, setUserData] = useState<any>(null);
    const [contributions, setContributions] = useState<any[]>([]);
    const [allContributions, setAllContributions] = useState<any[]>([]);

    // Loading States
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Social Media State
    const [socialPlatform, setSocialPlatform] = useState('facebook');
    const [socialHandle, setSocialHandle] = useState('');

    // --- Main Data Fetching Effect ---
    useEffect(() => {
        // 1. Wait for Auth and Firestore
        if (userAuthLoading) return;
        if (!firestore || !user) {
            setIsDataLoading(false);
            return;
        }

        setIsDataLoading(true);

        const userDocRef = doc(firestore, 'users', user.uid);

        // 2. Contributions Queries
        const recentQuery = query(
            collection(firestore, 'contributions'),
            where('submittedBy', '==', user.uid),
            orderBy('submittedAt', 'desc'),
            limit(5)
        );

        const allQuery = query(
            collection(firestore, 'contributions'),
            where('submittedBy', '==', user.uid)
        );

        // 3. Set up Listeners
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData(data);

                // Parse Social Link on load
                if (data.socialMediaLink) {
                    try {
                        const url = new URL(data.socialMediaLink);
                        const platform = url.hostname.includes('instagram') ? 'instagram' : 'facebook';
                        const handle = url.pathname.substring(1).replace(/\/$/, '');
                        setSocialPlatform(platform);
                        setSocialHandle(handle);
                    } catch (e) {
                        setSocialPlatform('facebook');
                        setSocialHandle('');
                    }
                }
            } else {
                // User document doesn't exist -> Create it
                setUserData(null);
                createProfile(user, userDocRef);
            }
        });

        const unsubscribeRecent = onSnapshot(recentQuery, (snapshot) => {
            setContributions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubscribeAll = onSnapshot(allQuery, (snapshot) => {
            setAllContributions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            // Once we have at least user listener setup (and potentially data), stop loading
            // We can settle loading state here or debounced, but essentially data is flowing.
            setIsDataLoading(false);
        }, (error) => {
            console.error("Error fetching contributions:", error);
            setIsDataLoading(false);
        });

        return () => {
            unsubscribeUser();
            unsubscribeRecent();
            unsubscribeAll();
        };
    }, [user, userAuthLoading, firestore]);

    // --- Profile Creation Helper ---
    const createProfile = async (currentUser: any, ref: any) => {
        try {
            const { uid, displayName, email, photoURL } = currentUser;
            await setDoc(ref, {
                uid,
                displayName: displayName || email?.split('@')[0] || 'Anonymous',
                email,
                photoURL,
                points: increment(0),
                role: 'user',
                socialMediaLink: null,
            }, { merge: true });
        } catch (error) {
            console.error("Error creating profile:", error);
        }
    };

    const handleSaveSocialLink = async () => {
        if (!user || !firestore) return;
        setIsSaving(true);
        let linkToSave = null;

        if (socialHandle.trim()) {
            linkToSave = `https://www.${socialPlatform}.com/${socialHandle.replace('@', '').trim()}`;
        }

        try {
            const userRef = doc(firestore, 'users', user.uid);
            await setDoc(userRef, { socialMediaLink: linkToSave }, { merge: true });
            toast({ title: "Success", description: linkToSave ? "Social link updated." : "Social link removed." });
        } catch (error) {
            console.error("Error updating social media link: ", error);
            toast({ title: "Error", description: "Failed to update social link.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSignOut = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    };

    const stats = useMemo(() => {
        if (!allContributions) return { approved: 0, pending: 0, rejected: 0 };
        return allContributions.reduce((acc, curr) => {
            const status = curr.status as SubmissionStatus;
            if (acc[status] !== undefined) {
                acc[status]++;
            }
            return acc;
        }, { approved: 0, pending: 0, rejected: 0 });
    }, [allContributions]);

    const renderContent = () => {
        if (userAuthLoading || isDataLoading) {
            return (
                <div className="container mx-auto flex h-screen items-center justify-center">
                    <LoaderCircle className="h-12 w-12 animate-spin" />
                </div>
            );
        }

        return (
            <div className="bg-gray-100 dark:bg-gray-900 min-h-screen py-8">
                <div className="container mx-auto px-4">
                    {user && userData ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {/* Left Sidebar */}
                            <div className="md:col-span-1">
                                <Card>
                                    <CardHeader className="items-center text-center">
                                        <Avatar className="h-24 w-24 mb-4">
                                            <AvatarImage src={userData.photoURL || undefined} alt={userData.displayName} />
                                            <AvatarFallback>
                                                {userData.displayName?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <CardTitle className="font-headline text-2xl">{userData.displayName}</CardTitle>
                                        <CardDescription>{userData.email}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-2">
                                        <Button asChild variant="ghost" className="justify-start gap-2">
                                            <Link href="/profile">
                                                <User className="h-4 w-4" /> Profile
                                            </Link>
                                        </Button>
                                        <Button asChild variant="ghost" className="justify-start gap-2">
                                            <Link href="/my-contributions">
                                                <Activity className="h-4 w-4" /> My Contributions
                                            </Link>
                                        </Button>
                                        <Button asChild variant="ghost" className="justify-start gap-2">
                                            <Link href="/settings">
                                                <Settings className="h-4 w-4" /> Settings
                                            </Link>
                                        </Button>
                                        {userData.role === 'admin' && (
                                            <Button asChild variant="ghost" className="justify-start gap-2 text-primary">
                                                <Link href="/admin">
                                                    <Shield className="h-4 w-4" /> Admin Panel
                                                </Link>
                                            </Button>
                                        )}
                                    </CardContent>
                                    <CardFooter className="flex flex-col gap-2">
                                        <Button variant="destructive" className="w-full" onClick={handleSignOut}>
                                            <LogOut className="mr-2 h-4 w-4" /> Sign Out
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>

                            {/* Main Content */}
                            <div className="md:col-span-3 space-y-8">
                                {/* Points and Stats */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Points</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-4xl font-bold text-primary">{userData.points || 0}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Approved</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-4xl font-bold text-green-600">{stats.approved}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Pending</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-4xl font-bold">{stats.pending}</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Recent Contributions */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="font-headline">Recent Contributions</CardTitle>
                                        <CardDescription>Your last 5 submissions.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {contributions && contributions.length > 0 ? (
                                            <div className="space-y-4">
                                                {contributions.map(c => {
                                                    const status = c.status as SubmissionStatus;
                                                    const config = statusConfig[status] || statusConfig.pending;
                                                    return (
                                                        <Card key={c.id} className="shadow-sm">
                                                            <CardHeader>
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <CardTitle className="text-base font-semibold">{c.accessoryType}</CardTitle>
                                                                        <CardDescription>
                                                                            Submitted {c.submittedAt?.toDate ? formatDistanceToNow(c.submittedAt.toDate(), { addSuffix: true }) : ''}
                                                                        </CardDescription>
                                                                    </div>
                                                                    {config.badge}
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <p className="font-medium text-sm mb-2">Compatible Models:</p>
                                                                <ul className="list-disc list-inside bg-muted/50 p-3 rounded-md text-sm">
                                                                    {c.models?.map((model: string) => <li key={model}>{model}</li>)}
                                                                </ul>
                                                                {c.source && (
                                                                    <div className="mt-3 text-xs">
                                                                        <span className="font-semibold">Source: </span>
                                                                        <a href={c.source} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{c.source}</a>
                                                                    </div>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <p className="text-muted-foreground mb-4">You haven't made any contributions yet.</p>
                                                <Button asChild>
                                                    <Link href="/contribute">
                                                        <PlusCircle className="mr-2 h-4 w-4" />
                                                        Make Your First Contribution
                                                    </Link>
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Social Media Link */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg font-headline">Social Media</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex w-full items-center space-x-2">
                                            <Select value={socialPlatform} onValueChange={setSocialPlatform}>
                                                <SelectTrigger className="w-[140px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="facebook">Facebook</SelectItem>
                                                    <SelectItem value="instagram">Instagram</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                id="social-link"
                                                placeholder="your-profile"
                                                value={socialHandle}
                                                onChange={(e) => setSocialHandle(e.target.value)}
                                            />

                                        </div>
                                        <Button onClick={handleSaveSocialLink} disabled={isSaving} size="sm" className="mt-4 w-full">
                                            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Save Social Link'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    ) : user ? (
                        <div className="flex justify-center py-12">
                            <LoaderCircle className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Card className="mx-auto max-w-md">
                            <CardHeader>
                                <CardTitle className="font-headline">You are not signed in</CardTitle>
                                <CardDescription>
                                    Sign in to view your profile, contribute data, and climb the leaderboard.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                <Button asChild>
                                    <Link href="/login">Sign In</Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href="/register">Create an Account</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        );
    }

    return (
        <AppLayout>
            {renderContent()}
        </AppLayout>
    )
}
