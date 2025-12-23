'use client';

import { SubmissionsManager } from '@/components/admin/submissions-manager';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';

export default function SubmissionsPage() {
  const firestore = useFirestore();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const q = query(
      collection(firestore, 'contributions'),
      orderBy('submittedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubmissions(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching submissions:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoaderCircle className="animate-spin h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">Submissions</h1>
        <p className="text-muted-foreground">Manage all contribution requests.</p>
      </div>
      <SubmissionsManager initialSubmissions={submissions} />
    </div>
  );
}
