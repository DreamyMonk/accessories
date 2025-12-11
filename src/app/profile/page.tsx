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
import { LoaderCircle, LogOut, PlusCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { doc, setDoc } from 'firebase/firestore';
import { useMemo, useEffect } from 'react';
import { useDoc } from '@/firebase';
import Link from 'next/link';

export default function ProfilePage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();

  const userRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  
  const { data: userData, loading: userDataLoading } = useDoc(userRef);

  useEffect(() => {
    // When a user signs in for the first time, create their document.
    // This now works for email/password as well.
    if (user && !userData && !userDataLoading && firestore && userRef) {
      const { uid, displayName, email, photoURL } = user;
      setDoc(userRef, {
        uid,
        displayName: displayName || email?.split('@')[0] || 'Anonymous',
        email,
        photoURL,
        points: 0,
        role: 'user', // Default role
      }, { merge: true });
    }
  }, [user, userData, userDataLoading, userRef, firestore]);

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      // Redirect to login page after sign out
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };
  
  const isLoading = userLoading || userDataLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto flex h-screen items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {user && userData ? (
        <Card className="mx-auto max-w-md">
          <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={userData.photoURL || undefined} alt={userData.displayName} />
              <AvatarFallback>
                {userData.displayName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="pt-4 font-headline text-2xl">
              {userData.displayName}
            </CardTitle>
            <CardDescription>{userData.email}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
             <p className="text-sm text-muted-foreground">Your points</p>
             <p className="text-4xl font-bold text-primary">{userData.points || 0}</p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button asChild className="w-full">
                <Link href="/contribute"><PlusCircle className="mr-2 h-4 w-4" /> Contribute Data</Link>
            </Button>
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </CardFooter>
        </Card>
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
  );
}
