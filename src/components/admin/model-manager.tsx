'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function ModelManager() {
  const [newModel, setNewModel] = useState('');
  const firestore = useFirestore();
  const { data: models, loading, error } = useCollection(firestore ? collection(firestore, 'masterModelList') : null);
  const { toast } = useToast();

  const handleAddModel = async () => {
    if (!firestore || !newModel.trim()) return;

    try {
      await addDoc(collection(firestore, 'masterModelList'), { name: newModel });
      setNewModel('');
      toast({ title: "Model added", description: `"${newModel}" has been added to the master list.` });
    } catch (e) {
      toast({ title: "Error adding model", description: "Could not add the model. Please try again.", variant: "destructive" });
    }
  };

  const handleDeleteModel = async (id: string, name: string) => {
    if (!firestore) return;

    try {
      await deleteDoc(doc(firestore, 'masterModelList', id));
      toast({ title: "Model deleted", description: `"${name}" has been removed from the master list.` });
    } catch (e) {
      toast({ title: "Error deleting model", description: "Could not delete the model. Please try again.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Master Model List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="e.g., iPhone 15 Pro"
            value={newModel}
            onChange={(e) => setNewModel(e.target.value)}
          />
          <Button onClick={handleAddModel}>Add Model</Button>
        </div>
        <div>
          {loading && <p>Loading models...</p>}
          {error && <p className="text-destructive">Error loading models.</p>}
          <ul className="space-y-2">
            {models?.map((model) => (
              <li key={model.id} className="flex justify-between items-center p-2 bg-secondary rounded-md">
                <span>{model.name}</span>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteModel(model.id, model.name)}>Delete</Button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
