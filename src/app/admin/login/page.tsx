'use client';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Logo } from '@/components/logo';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;


export default function AdminLoginPage() {
  const auth = useAuth();
  const { user, loading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });


  useEffect(() => {
    if (user) {
      router.push('/admin');
    }
  }, [user, router]);


  const handleSignIn = async (data: LoginFormValues) => {
    if(!auth) return;
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      router.push('/admin');
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast({
        title: 'Sign-in Failed',
        description: 'Please check your email and password.',
        variant: 'destructive',
      });
    }
  };

  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <Card className="mx-auto w-full max-w-sm">
         <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
              <Logo className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Admin Panel</CardTitle>
          <CardDescription>
            Please sign in to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSignIn)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Sign In'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
