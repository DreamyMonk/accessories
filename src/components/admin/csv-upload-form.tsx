'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, Upload } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function CsvUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !firestore) {
      toast({
        title: 'Error',
        description: 'Please select a file and ensure you are connected.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvData = event.target?.result as string;
      const lines = csvData.split('\n').filter(line => line.trim() !== '');
      const header = lines.shift()?.split(',').map(h => h.trim());
      
      const requiredHeaders = ['primaryModel', 'accessoryType', 'compatibleModels', 'brand', 'source'];
      if (!header || !requiredHeaders.every(h => header.includes(h))) {
        toast({ title: 'Error', description: `CSV must contain the following headers: ${requiredHeaders.join(', ')}`, variant: 'destructive' });
        setIsUploading(false);
        return;
      }

      if (lines.length === 0) {
        toast({ title: 'Warning', description: 'CSV file is empty or contains only a header.', variant: 'destructive' });
        setIsUploading(false);
        return;
      }

      try {
        const batch = writeBatch(firestore);
        const accessoriesCollectionRef = collection(firestore, 'accessories');

        lines.forEach((line) => {
          const values = line.split(',').map(field => field.trim());
          const accessoryRow: { [key: string]: string } = {};
          header.forEach((h, i) => accessoryRow[h] = values[i]);
          
          const { primaryModel, accessoryType, compatibleModels: compatibleModelsStr, brand, source } = accessoryRow;
          
          if (primaryModel && accessoryType && compatibleModelsStr) {
            const compatibleModels = compatibleModelsStr.split(';').map(m => m.trim());
            const newAccessoryRef = doc(accessoriesCollectionRef);
            const accessoryData = {
              primaryModel,
              accessoryType,
              compatibleModels,
              brand: brand || '',
              source: source || 'Bulk Upload',
              lastUpdated: serverTimestamp(),
              contributor: {
                name: 'Admin',
                points: 0,
              },
            };
            batch.set(newAccessoryRef, accessoryData);
          }
        });

        await batch.commit();

        toast({
          title: 'Upload Successful',
          description: `${lines.length} accessories have been added.`,
        });
      } catch (error: any) {
        console.error('Error uploading CSV data:', error);
        
        const permissionError = new FirestorePermissionError({
          path: 'accessories',
          operation: 'create',
          requestResourceData: {note: `Batch operation failed. Error: ${error.message}`}
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
          title: 'Upload Failed',
          description: 'An error occurred while uploading. Check permissions and data format.',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if(fileInput) fileInput.value = '';
        setFile(null);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      <Input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        disabled={isUploading}
        className="flex-grow"
      />
      <Button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full sm:w-auto"
      >
        {isUploading ? (
          <>
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload CSV
          </>
        )}
      </Button>
    </div>
  );
}
