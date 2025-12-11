'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { LoaderCircle, Users, FileCheck, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const StatCard = ({ title, value, icon, href, loading }: { title: string, value: number, icon: React.ReactNode, href: string, loading: boolean }) => (
    <Link href={href}>
        <Card className="hover:bg-card/60 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                {loading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{value}</div>}
            </CardContent>
        </Card>
    </Link>
);


export function AdminDashboard() {
  const firestore = useFirestore();

  const { data: users, loading: usersLoading } = useCollection(
    firestore ? query(collection(firestore, 'users')) : null
  );
  const { data: accessories, loading: accessoriesLoading } = useCollection(
    firestore ? query(collection(firestore, 'accessories')) : null
  );
  const { data: submissions, loading: submissionsLoading } = useCollection(
    firestore ? query(collection(firestore, 'contributions')) : null
  );
 
  const stats = [
    {
      title: 'Total Users',
      value: users?.length ?? 0,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      href: '#',
      loading: usersLoading,
    },
    {
      title: 'Live Accessories',
      value: accessories?.length ?? 0,
      icon: <ShieldCheck className="h-4 w-4 text-muted-foreground" />,
      href: '#',
      loading: accessoriesLoading,
    },
    {
      title: 'Total Submissions',
      value: submissions?.length ?? 0,
      icon: <FileCheck className="h-4 w-4 text-muted-foreground" />,
      href: '/admin/submissions',
      loading: submissionsLoading,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map(stat => <StatCard key={stat.title} {...stat} />)}
    </div>
  );
}
