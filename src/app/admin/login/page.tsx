'use client';
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
  const router = useRouter();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'kodshift@gmail.com', password: 'Asdfghjkl@135' },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (localStorage.getItem('isAdminLoggedIn') === 'true') {
      router.push('/admin');
    }
  }, [router]);

  const handleSignIn = (data: LoginFormValues) => {
    // This is a simplified, non-Firebase admin login.
    if (data.email === 'kodshift@gmail.com' && data.password === 'Asdfghjkl@135') {
      try {
        localStorage.setItem('isAdminLoggedIn', 'true');
        router.push('/admin');
      } catch (error) {
         toast({
          title: 'Login Error',
          description: 'Could not save login state. Please enable local storage.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Sign-in Failed',
        description: 'Incorrect email or password.',
        variant: 'destructive',
      });
    }
  };
  
  if (typeof window !== 'undefined' && localStorage.getItem('isAdminLoggedIn') === 'true') {
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
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleSignIn)} className="space-y-4">
              <FormField
                control={loginForm.control}
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
              <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                {loginForm.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Sign In'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
