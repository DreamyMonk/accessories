'use client';

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { collection, getDocs, query, orderBy, getFirestore } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { getMasterModels } from "./master-models/actions";

export default function AdminPage() {
  const firestore = useFirestore();
  const [masterModels, setMasterModels] = useState<string[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!firestore) return;

      try {
        // Fetch Master Models
        const mm = await getMasterModels();
        setMasterModels(mm);

        // Fetch Submissions
        const submissionsRef = collection(firestore, 'contributions');
        const q = query(submissionsRef, orderBy('submittedAt', 'desc'));
        const subSnapshot = await getDocs(q);
        setSubmissions(subSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Models (Accessories)
        const modelsRef = collection(firestore, 'accessories');
        const modelSnapshot = await getDocs(modelsRef);
        setModels(modelSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [firestore]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoaderCircle className="animate-spin h-12 w-12" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage submissions, master models, and add new data.
        </p>
      </div>
      <AdminDashboard masterModels={masterModels} submissions={submissions} models={models} />
    </div>
  );
}
