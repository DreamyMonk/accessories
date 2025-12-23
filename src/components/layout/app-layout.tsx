'use client';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <div className="relative flex min-h-screen w-full flex-col pt-16 pb-20 md:pb-0">
        <main className="flex-1">{children}</main>
      </div>
      <BottomNav />
    </>
  );
}
