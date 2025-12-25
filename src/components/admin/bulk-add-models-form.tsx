'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFirestore } from '@/firebase';
import { doc, writeBatch, arrayUnion, query, collection, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, Upload, Download } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function BulkAddModelsForm() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("");

    const firestore = useFirestore();
    const { toast } = useToast();

    useEffect(() => {
        if (!firestore) return;
        const q = query(collection(firestore, "categories"), orderBy("name", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCategories(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, [firestore]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    const handleDownloadSample = () => {
        const headers = ['model', 'category', 'accessoryId', 'contributorName'];
        const sampleData = [
            ['iPhone 13|iPhone 13 Pro', 'Silicone Case', '', 'John Doe'],
            ['Samsung Galaxy S22', 'Tempered Glass', '', ''],
        ];

        const csvContent = [
            headers.join(','),
            ...sampleData.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'sample_bulk_upload.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

            // Check required fields (Only model is strictly required now)
            if (!header.includes('model')) {
                toast({ title: 'Error', description: `CSV must contain a 'model' header.`, variant: 'destructive' });
                setIsUploading(false);
                return;
            }

            const accessoryIdIndex = header.indexOf('accessoryId');
            const modelIndex = header.indexOf('model');
            const contributorNameIndex = header.indexOf('contributorName');
            const categoryIndex = header.indexOf('category');

            const batch = writeBatch(firestore);
            let operationsCount = 0;
            // Store models AND optional type per accessory
            const updatesByAccessory: Record<string, { models: any[], type?: string }> = {};

            for (const line of lines) {
                const values = line.split(',').map(v => v.trim());
                if (values.length <= modelIndex) continue;

                let accessoryId = accessoryIdIndex !== -1 ? values[accessoryIdIndex] : '';
                const rawModelData = values[modelIndex];
                const rawContributorData = contributorNameIndex !== -1 ? values[contributorNameIndex] : '';
                const categoryFromCsv = categoryIndex !== -1 ? values[categoryIndex] : '';

                // If no ID provided, generate a new one for this row.
                if (!accessoryId) {
                    accessoryId = doc(collection(firestore, 'accessories')).id;
                }

                if (rawModelData) {
                    if (!updatesByAccessory[accessoryId]) {
                        updatesByAccessory[accessoryId] = { models: [] };
                    }

                    if (categoryFromCsv) {
                        updatesByAccessory[accessoryId].type = categoryFromCsv;
                    }

                    // Split by pipe '|' and filter empty strings
                    const models = rawModelData.split('|').map(m => m.trim()).filter(Boolean);
                    const contributors = rawContributorData ? rawContributorData.split('|').map(c => c.trim()) : [];

                    models.forEach((modelName, index) => {
                        const contributorName = contributors[index] || contributors[0] || undefined;

                        const modelObject: any = { name: modelName };
                        if (contributorName) {
                            modelObject.contributorName = contributorName;
                        }

                        updatesByAccessory[accessoryId].models.push(modelObject);
                        operationsCount++;
                    });
                }
            }

            // Apply batched updates
            Object.entries(updatesByAccessory).forEach(([accessoryId, data]) => {
                const accessoryRef = doc(firestore, 'accessories', accessoryId);

                const payload: any = {
                    models: arrayUnion(...data.models),
                    lastUpdated: serverTimestamp()
                };

                // Priority: CSV Category > Dropdown Category
                const typeToSave = data.type || selectedCategory;
                if (typeToSave) {
                    payload.accessoryType = typeToSave;
                }

                batch.set(accessoryRef, payload, { merge: true });
            });

            try {
                await batch.commit();
                toast({
                    title: 'Upload Successful',
                    description: `${operationsCount} models have been added.`,
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
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-xl">Bulk Add Models via CSV</CardTitle>
                        <CardDescription>
                            Upload a CSV file to add models. 'accessoryId' is optional; if omitted, new groups are created.
                            You can specify 'category' in CSV or select one below.
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownloadSample}>
                        <Download className="mr-2 h-4 w-4" /> Download Sample
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Default Category (Optional if in CSV)</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Default Category..." />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

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
                    <p className="text-xs text-muted-foreground mt-2">
                        Required Columns: <code>model</code>.
                        Optional: <code>category</code>, <code>accessoryId</code>, <code>contributorName</code>.
                        <br />
                        Use <code>|</code> to separate multiple models in a single row (Auto-groups them).
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
