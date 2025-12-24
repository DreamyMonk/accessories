'use client';

import { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, PlusCircle, LoaderCircle, Upload, Download } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, setDoc, doc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import Papa from 'papaparse';

export function MasterModelManager() {
  const [newModel, setNewModel] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firestore = useFirestore();

  const modelsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'master_models'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: modelDocs, loading } = useCollection(modelsQuery);

  const models = useMemo(() => {
    return modelDocs ? modelDocs.map(d => d.name as string) : [];
  }, [modelDocs]);

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel.trim() || !firestore) return;

    setIsAdding(true);
    const newModelName = newModel.trim();
    const modelId = newModelName; // Use name as ID for uniqueness

    try {
      await setDoc(doc(firestore, 'master_models', modelId), {
        name: newModelName,
        createdAt: serverTimestamp()
      });
      setNewModel("");
      toast({ title: "Model Added", description: `'${newModelName}' has been added.` });
    } catch (error) {
      console.error("Error adding model:", error);
      toast({ title: "Error", description: "Failed to add model.", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteModel = async (modelToDelete: string) => {
    if (!firestore) return;
    setIsDeleting(modelToDelete);
    try {
      await deleteDoc(doc(firestore, 'master_models', modelToDelete));
      toast({ title: "Model Deleted", description: `'${modelToDelete}' has been removed.` });
    } catch (error) {
      console.error("Error deleting model:", error);
      toast({ title: "Error", description: "Failed to delete model.", variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      toast({ title: "No file selected", description: "Please select a CSV file to upload.", variant: "destructive" });
      return;
    }

    if (!firestore) return;

    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: async (results) => {
        if (results.data.length === 0 && results.errors.length > 0) {
          toast({ title: "Upload Failed", description: "Failed to parse CSV. Ensure it has a 'model' header.", variant: "destructive" });
          setIsUploading(false);
          return;
        }

        const newModelsToProcess = results.data
          .map((row: any) => {
            return row.model?.trim() || row['master model']?.trim() || row.name?.trim() || row.value?.trim();
          })
          .filter((m: string | undefined): m is string => !!m && m.length > 0);

        // Filter out models that already exist in the CURRENT list to save writes
        // (Client-side check is good enough for user feedback, Firestore will just overwrite if we setDoc anyway)
        // But to avoid unnecessary writes, let's filter.
        const uniqueNewModels = Array.from(new Set(newModelsToProcess))
          .filter(m => !models.includes(m));

        if (uniqueNewModels.length === 0) {
          toast({ title: "No New Models", description: "All models in the CSV already exist." });
          setIsUploading(false);
          return;
        }

        // Batch writes (max 500 per batch)
        const batches = [];
        let currentBatch = writeBatch(firestore);
        let operationCount = 0;

        for (const modelName of uniqueNewModels) {
          const docRef = doc(firestore, 'master_models', modelName);
          currentBatch.set(docRef, { name: modelName, createdAt: serverTimestamp() });
          operationCount++;

          if (operationCount === 500) {
            batches.push(currentBatch.commit());
            currentBatch = writeBatch(firestore);
            operationCount = 0;
          }
        }

        if (operationCount > 0) {
          batches.push(currentBatch.commit());
        }

        try {
          await Promise.all(batches);
          toast({ title: "Upload Successful", description: `${uniqueNewModels.length} new models were added.` });
          if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        } catch (error) {
          console.error("Batch write error:", error);
          toast({ title: "Upload Failed", description: "Failed to save models to database.", variant: "destructive" });
        } finally {
          setIsUploading(false);
        }
      },
      error: (error) => {
        console.error("CSV Parse Error:", error);
        toast({ title: "Upload Failed", description: "Failed to read CSV file.", variant: "destructive" });
        setIsUploading(false);
      }
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage Models</CardTitle>
          <CardDescription>Add or remove models from the master list.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAddModel} className="flex items-center gap-2">
            <Input
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              placeholder="Enter new model name"
              disabled={isAdding}
            />
            <Button type="submit" disabled={isAdding || !newModel.trim()}>
              {isAdding ? <LoaderCircle className="animate-spin h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
              <span className="ml-2 hidden sm:inline">Add Model</span>
            </Button>
          </form>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Existing Models ({models.length})</h3>
            <ScrollArea className="h-72 w-full rounded-md border">
              <div className="p-4">
                {loading && models.length === 0 && <div className="flex justify-center p-4"><LoaderCircle className="animate-spin" /></div>}

                {!loading && models.length > 0 ? (
                  <ul className="space-y-2">
                    {models.map(model => (
                      <li key={model} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <span className="text-sm">{model}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteModel(model)}
                          disabled={isDeleting === model}
                        >
                          {isDeleting === model ? <LoaderCircle className="animate-spin h-4 w-4" /> : <Trash2 className="text-destructive h-4 w-4" />}
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  !loading && <p className="text-sm text-center text-muted-foreground p-4">No models found.</p>
                )}
              </div>
            </ScrollArea>
          </div>

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-grow">
              <CardTitle>Bulk Upload Models</CardTitle>
              <CardDescription>
                Upload a CSV file to add multiple models at once.
              </CardDescription>
            </div>
            <a href="/master-models-template.csv" download>
              <Button variant="outline" className="mt-4 sm:mt-0">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCsvUpload} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The CSV should have a single column with the header `model` (or `name`, `master model`).
            </p>
            <Input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              disabled={isUploading}
            />
            <Button type="submit" disabled={isUploading}>
              {isUploading ? <LoaderCircle className="animate-spin h-5 w-5" /> : <Upload className="h-5 w-5" />}
              <span className="ml-2">Upload CSV</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
