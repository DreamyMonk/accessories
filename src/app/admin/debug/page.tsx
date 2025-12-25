'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, getDoc, getDocs, collection, query, writeBatch } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function DebugPage() {
    const [id, setId] = useState('');
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteStatus, setDeleteStatus] = useState('');
    const firestore = useFirestore();

    const handleFetch = async () => {
        if (!firestore || !id) return;
        try {
            setError('');
            setData(null);
            const docRef = doc(firestore, 'accessories', id);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                setData({ id: snap.id, ...snap.data() });
            } else {
                setError('Document not found');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleNuke = async () => {
        if (!firestore) return;
        if (!confirm("⚠️ DANGER ZONE ⚠️\n\nAre you sure you want to delete ALL accessories from the database? This cannot be undone.")) return;
        if (!confirm("Really sure? This will verify wipe everything.")) return;

        setIsDeleting(true);
        setDeleteStatus('Fetching documents...');

        try {
            const q = query(collection(firestore, 'accessories'));
            const snapshot = await getDocs(q);
            const total = snapshot.size;
            setDeleteStatus(`Found ${total} documents. Deleting...`);

            // Firebase batch limit is 500. We use 400 to be safe.
            const BATCH_SIZE = 400;
            const chunks = [];

            for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
                chunks.push(snapshot.docs.slice(i, i + BATCH_SIZE));
            }

            let deletedCount = 0;
            for (const chunk of chunks) {
                const batch = writeBatch(firestore);
                chunk.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                deletedCount += chunk.length;
                setDeleteStatus(`Deleted ${deletedCount} / ${total}...`);
            }

            setDeleteStatus(`Successfully deleted all ${total} accessories.`);
        } catch (err: any) {
            setDeleteStatus(`Error: ${err.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="space-y-4">
                <h1 className="text-2xl font-bold">Debug Accessory Data</h1>
                <div className="flex gap-4 max-w-md">
                    <Input placeholder="Accessory ID (e.g. T091)" value={id} onChange={e => setId(e.target.value)} />
                    <Button onClick={handleFetch}>Inspect</Button>
                </div>
                {error && <div className="text-destructive font-medium">{error}</div>}
                {data && (
                    <Card>
                        <CardHeader><CardTitle>Document Data</CardTitle></CardHeader>
                        <CardContent>
                            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
                                {JSON.stringify(data, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="border border-destructive/50 rounded-lg p-6 bg-destructive/5 space-y-4">
                <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-6 w-6" />
                    <h2 className="text-xl font-bold">Danger Zone</h2>
                </div>
                <p className="text-muted-foreground">
                    Use this button to completely wipe all accessory data from the database.
                    This is useful if you want to clear bad data and re-upload from CSV.
                </p>
                <div className="flex items-center gap-4">
                    <Button variant="destructive" onClick={handleNuke} disabled={isDeleting}>
                        {isDeleting ? 'Deleting...' : '☢️ NUKE ALL DATA'}
                    </Button>
                    {deleteStatus && <span className="font-mono text-sm">{deleteStatus}</span>}
                </div>
            </div>
        </div>
    );
}
