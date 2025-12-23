'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, PlusCircle, LoaderCircle, Upload, Download } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { addMasterModel, deleteMasterModel, addMasterModelsFromCsv } from '@/app/admin/master-models/actions';
import { ScrollArea } from '@/components/ui/scroll-area';

export function MasterModelManager({ initialModels }: { initialModels: string[] }) {
  const [models, setModels] = useState<string[]>(initialModels);
  const [newModel, setNewModel] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel.trim()) return;

    setIsAdding(true);
    const newModelName = newModel.trim();

    const result = await addMasterModel(newModelName);

    if (result.success) {
      setModels(prev => [...prev, newModelName].sort());
      setNewModel("");
      toast({ title: "Model Added", description: `'${newModelName}' has been added.` });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsAdding(false);
  };

  const handleDeleteModel = async (modelToDelete: string) => {
    setIsDeleting(modelToDelete);
    const result = await deleteMasterModel(modelToDelete);
    if (result.success) {
      setModels(prev => prev.filter(m => m !== modelToDelete));
      toast({ title: "Model Deleted", description: `'${modelToDelete}' has been removed.` });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsDeleting(null);
  };
  
  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      toast({ title: "No file selected", description: "Please select a CSV file to upload.", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvContent = event.target?.result as string;
      const result = await addMasterModelsFromCsv(csvContent);

      if (result.success) {
        // Re-fetch or update the models list after upload
        // For now, we can just show a success message
        toast({ title: "Upload Successful", description: `${result.addedCount} new models were added.` });
        // A full page reload might be the simplest way to see the updated list for now
        window.location.reload();
      } else {
        toast({ title: "Upload Failed", description: result.error, variant: "destructive" });
      }
      setIsUploading(false);
    };
    reader.readAsText(file);
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
                        {models.length > 0 ? (
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
                            <p className="text-sm text-center text-muted-foreground p-4">No models found.</p>
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
                    The CSV should have a single column with the header `model`.
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
