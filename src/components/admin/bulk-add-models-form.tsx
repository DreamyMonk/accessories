'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFirestore } from '@/firebase';
import { doc, writeBatch, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, Upload } from 'lucide-react';

export function BulkAddModelsForm() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
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
            const headerLine = lines.shift();
            if (!headerLine) {
                toast({ title: 'Error', description: 'CSV file is empty.', variant: 'destructive' });
                setIsUploading(false);
                return;
            }
            const header = headerLine.split(',').map(h => h.trim());

            const requiredHeaders = ['accessoryId', 'model'];
            if (!requiredHeaders.every(h => header.includes(h))) {
                toast({ title: 'Error', description: `CSV must contain the following headers: ${requiredHeaders.join(', ')}`, variant: 'destructive' });
                setIsUploading(false);
                return;
            }

            const accessoryIdIndex = header.indexOf('accessoryId');
            const modelIndex = header.indexOf('model');
            const contributorNameIndex = header.indexOf('contributorName');

            const batch = writeBatch(firestore);
            let operationsCount = 0;

            for (const line of lines) {
                const values = line.split(',').map(v => v.trim());
                const accessoryId = values[accessoryIdIndex];
                const modelName = values[modelIndex];
                const contributorName = contributorNameIndex !== -1 ? values[contributorNameIndex] : undefined;

                if (accessoryId && modelName) {
                    const accessoryRef = doc(firestore, 'accessories', accessoryId);
                    const modelObject: any = { name: modelName };
                    if (contributorName) {
                        modelObject.contributorName = contributorName;
                    }
                    batch.update(accessoryRef, { models: arrayUnion(modelObject) });
                    operationsCount++;
                }
            }

            try {
                await batch.commit();
                toast({
                    title: 'Upload Successful',
                    description: `${operationsCount} models have been added to their respective accessory groups.`,
                });
            } catch (error) {
                console.error("Error bulk adding models:", error);
                toast({
                    title: 'Upload Failed',
                    description: 'An error occurred while adding models. Please check the console for details.',
                    variant: 'destructive',
                });
            } finally {
                setIsUploading(false);
                setFile(null);
            }
        };

        reader.readAsText(file);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl">Bulk Add Models via CSV</CardTitle>
                <CardDescription>
                    Upload a CSV file to add multiple models to existing accessory groups. The CSV must have `accessoryId` and `model` columns. An optional `contributorName` column can be included.
                </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
        </Card>
    );
}
