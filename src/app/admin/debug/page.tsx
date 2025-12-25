'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugPage() {
    const [id, setId] = useState('');
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState('');
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

    return (
        <div className="p-8 space-y-4">
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
    );
}
