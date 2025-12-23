'use client';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { AppLayout } from '@/components/layout/app-layout';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

const resetSchema = z.object({
  resetEmail: z.string().email('Please enter a valid email address.'),
})

type LoginFormValues = z.infer<typeof loginSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

export default function LoginPage() {
  const auth = useAuth();
  const { user, loading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  
  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { resetEmail: '' },
  });

  useEffect(() => {
    if (user) {
      router.push('/profile');
    }
  }, [user, router]);
  
  useEffect(() => {
    const emailFromLogin = loginForm.getValues("email");
    if(emailFromLogin) {
      resetForm.setValue("resetEmail", emailFromLogin);
    }
  }, [loginForm.watch('email')]);

  const handleSignIn = async (data: LoginFormValues) => {
    if (!auth) return;
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      router.push('/profile');
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast({
        title: 'Sign-in Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handlePasswordReset = async (data: ResetFormValues) => {
    if(!auth) return;
    setIsResetting(true);
    try {
        await sendPasswordResetEmail(auth, data.resetEmail);
        toast({
            title: 'Password Reset Email Sent',
            description: `If an account exists for ${data.resetEmail}, you will receive a reset link.`,
        });
        resetForm.reset();
    } catch (error: any) {
         toast({
            title: 'Error',
            description: error.message || 'Could not send password reset email.',
            variant: 'destructive',
        });
    } finally {
        setIsResetting(false);
    }
  }


  const renderContent = () => {
    if (loading || user) {
      return (
        <div className="flex h-[80vh] w-full items-center justify-center">
          <LoaderCircle className="h-12 w-12 animate-spin" />
        </div>
      );
    }
  
    return (
      <div className="container mx-auto flex h-[80vh] items-center justify-center px-4">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to continue to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleSignIn)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="link" size="sm" type="button" className="p-0 h-auto">Forgot Password?</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>
                        Enter your email address and we'll send you a link to reset your password.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...resetForm}>
                        <form onSubmit={resetForm.handleSubmit(handlePasswordReset)} className="space-y-4">
                             <FormField
                              control={resetForm.control}
                              name="resetEmail"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input placeholder="name@example.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                             <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={isResetting}>
                                    {isResetting ? <LoaderCircle className="animate-spin"/> : "Send Reset Link"}
                                </Button>
                             </DialogFooter>
                        </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                  {loginForm.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Sign In'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center text-sm">
            <p>
              Don't have an account?{' '}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <AppLayout>
      {renderContent()}
    </AppLayout>
  )
}
