'use client';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';
import Link from 'next/link';

const provider = new GoogleAuthProvider();

export default function RegisterPage() {
  const auth = useAuth();

  const handleSignUp = async () => {
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Error signing up with Google: ', error);
    }
  };

  return (
    <div className="container mx-auto flex h-[80vh] items-center justify-center px-4">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
          <CardDescription>
            Join our community to start contributing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleSignUp}>
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
            Sign up with Google
          </Button>
        </CardContent>
        <CardFooter className="justify-center text-sm">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
