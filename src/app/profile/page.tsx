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
import { GoogleAuthProvider, signInWithRedirect, signOut } from 'firebase/auth';
import { LoaderCircle, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { useDoc } from '@/firebase';

const provider = new GoogleAuthProvider();

export default function ProfilePage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();

  const userRef = user ? doc(firestore, 'users', user.uid) : null;
  const { data: userData, loading: userDataLoading } = useDoc(userRef);

  useEffect(() => {
    // When a user signs in for the first time, create their document.
    if (user && !userData && !userDataLoading) {
      const { uid, displayName, email, photoURL } = user;
      setDoc(userRef!, {
        uid,
        displayName,
        email,
        photoURL,
        points: 0,
        role: 'user', // Default role
      }, { merge: true });
    }
  }, [user, userData, userDataLoading, userRef]);


  const handleSignIn = async () => {
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google: ', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
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
              <AvatarImage src={userData.photoURL} alt={userData.displayName} />
              <AvatarFallback>
                {userData.displayName?.charAt(0)}
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
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle className="font-headline">Sign In</CardTitle>
            <CardDescription>
              Sign in to contribute data and climb the leaderboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={handleSignIn}>
              <svg
                className="mr-2 h-4 w-4"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 256S109.8 0 244 0c73 0 135.3 29.7 181.5 77.3L375 152.9C341.5 123.5 298.8 104 244 104c-82.3 0-149.2 67.2-149.2 150s66.9 150 149.2 150c94.9 0 131.3-64.4 136.8-98.2H244v-73.4h235.3c2.4 12.5 4.7 24.4 4.7 37.8z"
                ></path>
              </svg>
              Sign in with Google
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
