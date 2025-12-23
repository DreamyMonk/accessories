import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { collection, getDocs, query, orderBy, getFirestore } from "firebase/firestore";
import { promises as fs } from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from "@/firebase/config";

// Ensure Firebase is initialized for server-side
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getMasterModels() {
  const filePath = path.join(process.cwd(), 'src', 'data', 'master-models.json');
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Error reading master models:", error);
    return [];
  }
}

async function getSubmissions() {
  const submissionsRef = collection(db, 'contributions');
  const q = query(submissionsRef, orderBy('submittedAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getModels() {
  const modelsRef = collection(db, 'accessories');
  const querySnapshot = await getDocs(modelsRef);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}


export default async function AdminPage() {
  const masterModels = await getMasterModels();
  const submissions = await getSubmissions();
  const models = await getModels();

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
