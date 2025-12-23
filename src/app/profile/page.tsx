'use client';

import { useAuth, useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
<<<<<<< HEAD
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
=======
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
>>>>>>> fbc44eec518ddf89dd9fad935fe552e6bfd55d26
} from '@/components/ui/card';
import { signOut } from 'firebase/auth';
import { LoaderCircle, LogOut, PlusCircle, FileText, ThumbsUp, Clock, ThumbsDown, X, Check, Settings, User, Activity, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
<<<<<<< HEAD
import { doc, setDoc, collection, query, where, orderBy, limit, increment } from 'firebase/firestore';
=======
import { doc, setDoc, collection, query, where, orderBy, limit } from 'firebase/firestore';
>>>>>>> fbc44eec518ddf89dd9fad935fe552e6bfd55d26
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
<<<<<<< HEAD
    const auth = useAuth();
    const firestore = useFirestore();
    const { user, loading: userLoading } = useUser();
    const { toast } = useToast();

    const [socialPlatform, setSocialPlatform] = useState('facebook');
    const [socialHandle, setSocialHandle] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const userRef = useMemo(() => {
        if (!user?.uid || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user?.uid, firestore]);

    const { data: userData, loading: userDataLoading, error: userDataError } = useDoc(userRef);

    const contributionsQuery = useMemo(() => {
        if (!firestore || !user?.uid) return null;
        return query(
            collection(firestore, 'contributions'),
            where('submittedBy', '==', user.uid),
            orderBy('submittedAt', 'desc'),
            limit(5)
        );
    }, [firestore, user?.uid]);

    const { data: contributions, loading: contributionsLoading } = useCollection(contributionsQuery);

    const allContributionsQuery = useMemo(() => {
        if (!firestore || !user?.uid) return null;
        return query(
            collection(firestore, 'contributions'),
            where('submittedBy', '==', user.uid),
        );
    }, [firestore, user?.uid]);

    const { data: allContributions, loading: allContributionsLoading } = useCollection(allContributionsQuery);

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

    useEffect(() => {
        if (user && !userData && !userDataLoading && !userDataError && firestore && userRef) {
            const { uid, displayName, email, photoURL } = user;
            setDoc(userRef, {
                uid,
                displayName: displayName || email?.split('@')[0] || 'Anonymous',
                email,
                photoURL,
                points: increment(0),
                role: 'user',
                socialMediaLink: null,
            }, { merge: true });
        }
    }, [user, userData, userDataLoading, userDataError, userRef, firestore]);

    useEffect(() => {
        if (userDataLoading) return;

        if (userData?.socialMediaLink) {
            try {
                const url = new URL(userData.socialMediaLink);
                const platform = url.hostname.includes('instagram') ? 'instagram' : 'facebook';
                const handle = url.pathname.substring(1).replace(/\/$/, '');
                setSocialPlatform(platform);
                setSocialHandle(handle);
            } catch (e) {
                console.error("Invalid social media link in DB:", userData.socialMediaLink);
                setSocialPlatform('facebook');
                setSocialHandle('');
            }
        } else {
            setSocialPlatform('facebook');
            setSocialHandle('');
        }
    }, [userData?.socialMediaLink, userDataLoading]);

    const handleSaveSocialLink = async () => {
        if (!userRef) return;
        setIsSaving(true);
        let linkToSave = null;

        if (socialHandle.trim()) {
            linkToSave = `https://www.${socialPlatform}.com/${socialHandle.replace('@', '').trim()}`;
        }

        try {
            await setDoc(userRef, { socialMediaLink: linkToSave }, { merge: true });
            if (linkToSave) {
                toast({ title: "Success", description: "Your social media link has been updated." });
            } else {
                toast({ title: "Success", description: "Your social media link has been removed." });
            }
        } catch (error) {
            console.error("Error updating social media link: ", error);
            toast({ title: "Error", description: "Failed to update social media link.", variant: "destructive" });
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

    const isLoading = userLoading || userDataLoading || contributionsLoading || allContributionsLoading;

    const renderContent = () => {
        if (isLoading) {
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
=======
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();

  const [socialPlatform, setSocialPlatform] = useState('facebook');
  const [socialHandle, setSocialHandle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const userRef = useMemo(() => {
    if (!user?.uid || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user?.uid, firestore]);
  
  const { data: userData, loading: userDataLoading } = useDoc(userRef);

  const contributionsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(
        collection(firestore, 'contributions'),
        where('submittedBy', '==', user.uid),
        orderBy('submittedAt', 'desc'),
        limit(5)
    );
  }, [firestore, user?.uid]);

  const { data: contributions, loading: contributionsLoading } = useCollection(contributionsQuery);

  const allContributionsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(
        collection(firestore, 'contributions'),
        where('submittedBy', '==', user.uid),
    );
  }, [firestore, user?.uid]);

  const { data: allContributions, loading: allContributionsLoading } = useCollection(allContributionsQuery);

  const stats = useMemo(() => {
    if (!allContributions) return { approved: 0, pending: 0, rejected: 0 };
    return allContributions.reduce((acc, curr) => {
      acc[curr.status as SubmissionStatus]++;
      return acc;
    }, { approved: 0, pending: 0, rejected: 0 });
  }, [allContributions]);

  useEffect(() => {
    if (user && !userData && !userDataLoading && firestore && userRef) {
      const { uid, displayName, email, photoURL } = user;
      setDoc(userRef, {
        uid,
        displayName: displayName || email?.split('@')[0] || 'Anonymous',
        email,
        photoURL,
        points: 0,
        role: 'user',
        socialMediaLink: null,
      }, { merge: true });
    }
  }, [user, userData, userDataLoading, userRef, firestore]);

  useEffect(() => {
    if (userDataLoading) return;

    if (userData?.socialMediaLink) {
        try {
            const url = new URL(userData.socialMediaLink);
            const platform = url.hostname.includes('instagram') ? 'instagram' : 'facebook';
            const handle = url.pathname.substring(1).replace(/\/$/, '');
            setSocialPlatform(platform);
            setSocialHandle(handle);
        } catch (e) {
            console.error("Invalid social media link in DB:", userData.socialMediaLink);
            setSocialPlatform('facebook');
            setSocialHandle('');
        }
    } else {
        setSocialPlatform('facebook');
        setSocialHandle('');
    }
  }, [userData?.socialMediaLink, userDataLoading]);

  const handleSaveSocialLink = async () => {
    if (!userRef) return;
    setIsSaving(true);
    let linkToSave = null;
    
    if (socialHandle.trim()) {
        linkToSave = `https://www.${socialPlatform}.com/${socialHandle.replace('@', '').trim()}`;
    }

    try {
      await setDoc(userRef, { socialMediaLink: linkToSave }, { merge: true });
      if (linkToSave) {
        toast({ title: "Success", description: "Your social media link has been updated." });
      } else {
        toast({ title: "Success", description: "Your social media link has been removed." });
      }
    } catch (error) {
        console.error("Error updating social media link: ", error);
        toast({ title: "Error", description: "Failed to update social media link.", variant: "destructive" });
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
  
  const isLoading = userLoading || userDataLoading || contributionsLoading || allContributionsLoading;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="container mx-auto flex h-screen items-center justify-center">
          <LoaderCircle className="h-12 w-12 animate-spin" />
        </div>
      );
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen py-8">
            <div className="container mx-auto px-4">
            { user && userData ? (
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
                                        {contributions.map(c => (
                                            <Card key={c.id} className="shadow-sm">
                                                <CardHeader>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <CardTitle className="text-base font-semibold">{c.accessoryType}</CardTitle>
                                                            <CardDescription>
                                                                Submitted {c.submittedAt ? formatDistanceToNow(c.submittedAt.toDate(), { addSuffix: true }) : ''}
                                                            </CardDescription>
                                                        </div>
                                                        {statusConfig[c.status as SubmissionStatus].badge}
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="font-medium text-sm mb-2">Compatible Models:</p>
                                                    <ul className="list-disc list-inside bg-muted/50 p-3 rounded-md text-sm">
                                                        {c.models.map((model: string) => <li key={model}>{model}</li>)}
                                                    </ul>
                                                    {c.source && (
                                                        <div className="mt-3 text-xs">
                                                            <span className="font-semibold">Source: </span>
                                                            <a href={c.source} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{c.source}</a>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
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
>>>>>>> fbc44eec518ddf89dd9fad935fe552e6bfd55d26
}
