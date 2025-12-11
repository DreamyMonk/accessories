'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { Home, LoaderCircle, LogOut, Shield, Users, FileCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUser, useDoc, useFirestore, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useMemo } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  
  const userRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userData, loading: userDataLoading } = useDoc(userRef);

  const isLoading = userLoading || userDataLoading;
  const isAdmin = userData?.role === 'admin';

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/admin/login');
  }
  
  // If we're loading, show a spinner.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  // If the user is not logged in, redirect them to the admin login page,
  // unless they are already on it.
  if (!user && pathname !== '/admin/login') {
     router.push('/admin/login');
     return (
        <div className="flex h-screen w-full items-center justify-center">
            <LoaderCircle className="h-12 w-12 animate-spin" />
        </div>
     );
  }

  // If the user is logged in but not an admin, show access denied page,
  // unless they are on the login page.
  if (user && !isAdmin && pathname !== '/admin/login') {
     return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center">
        <Shield className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You do not have permission to view this page.
        </p>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/">Go to Homepage</Link>
          </Button>
           <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </div>
    );
  }
  
  // If user is on the login page, just show the content (the login form).
  if(pathname === '/admin/login') {
    return <>{children}</>
  }

  // If we've passed all checks, show the admin panel.
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Logo className="h-7 w-7 text-primary" />
            <span className="text-lg font-headline font-semibold">
              Admin Panel
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin'}
                tooltip={{ children: 'Dashboard' }}
              >
                <Link href="/admin">
                  <Home />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/admin/submissions')}
                tooltip={{ children: 'Submissions' }}
              >
                <Link href="/admin/submissions">
                  <FileCheck />
                  <span>Submissions</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/users'}
                tooltip={{ children: 'Users' }}
              >
                <Link href="/admin/users">
                  <Users />
                  <span>Users</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/'}
                tooltip={{ children: 'Back to App' }}
              >
                <Link href="/">
                  <Shield />
                  <span>Back to App</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          {user && (
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{user.displayName}</span>
                 <Button variant="link" size="sm" className="h-auto p-0 text-xs text-muted-foreground" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center justify-between border-b px-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-semibold">AccessoryAce</span>
          </Link>
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
