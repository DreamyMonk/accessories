'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, LoaderCircle, Trash2 } from "lucide-react";
import { useFirestore } from '@/firebase';
import { collection, query, addDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Label } from "@/components/ui/label";
import { addMasterModel } from '@/app/admin/master-models/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { SearchClient } from '@/components/search/search-client';

export function AddNewForm({ masterModels }: { masterModels: string[] }) {
    const [categories, setCategories] = useState<any[]>([]);

    // New Chain States
    const [newChainType, setNewChainType] = useState('');
    const [chainRows, setChainRows] = useState<{ model: string, contributorName: string }[]>([{ model: '', contributorName: '' }, { model: '', contributorName: '' }]); // Start with 2 rows
    const [creatingChain, setCreatingChain] = useState(false);

    const firestore = useFirestore();
    const { toast } = useToast();

    // Fetch Categories
    useEffect(() => {
        if (!firestore) return;
        const q = query(collection(firestore, "categories"), orderBy("name", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCategories(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, [firestore]);

    const handleChainRowChange = (index: number, field: 'model' | 'contributorName', value: string) => {
        const newRows = [...chainRows];
        newRows[index] = { ...newRows[index], [field]: value };
        setChainRows(newRows);
    };

    const addChainRow = () => {
        setChainRows([...chainRows, { model: '', contributorName: '' }]);
    };

    const removeChainRow = (index: number) => {
        const newRows = [...chainRows];
        newRows.splice(index, 1);
        setChainRows(newRows);
    };

    const handleCreateChain = async () => {
        if (!firestore || !newChainType) {
            toast({ title: "Missing fields", description: "Please select a category.", variant: "destructive" });
            return;
        }

        const validRows = chainRows.filter(r => r.model.trim() !== '');
        if (validRows.length < 2) {
            toast({ title: "Not enough models", description: "Please add at least 2 models to create a chain.", variant: "destructive" });
            return;
        }

        setCreatingChain(true);
        try {
            // Add to master models if new
            const modelsList = validRows.map(r => r.model.trim());
            for (const m of modelsList) {
                await addMasterModel(m);
            }

            const structuredModels = validRows.map(r => ({
                name: r.model.trim(),
                contributorUid: 'admin',
                contributorName: r.contributorName.trim() || undefined // Optional custom name
            }));

            await addDoc(collection(firestore, 'accessories'), {
                accessoryType: newChainType,
                models: structuredModels,
                contributor: {
                    uid: 'admin',
                    name: 'Admin',
                    points: 0
                },
                lastUpdated: serverTimestamp(),
                source: 'Admin Created'
            });

            toast({ title: "Success", description: "New compatibility chain created." });
            setNewChainType('');
            setChainRows([{ model: '', contributorName: '' }, { model: '', contributorName: '' }]);

        } catch (error) {
            console.error("Error creating chain:", error);
            toast({ title: "Error", description: "Failed to create chain.", variant: "destructive" });
        } finally {
            setCreatingChain(false);
        }
    };

    return (
        <div className="space-y-12">
            {/* Create New Chain Card */}
            <Card className="border-2 border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="font-headline text-xl flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Create New Compatibility Chain
                    </CardTitle>
                    <CardDescription>
                        Start a fresh group of compatible models. Select a category and add models.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-2">
                        <Label>Accessory Category</Label>
                        <Select value={newChainType} onValueChange={setNewChainType}>
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select Category..." />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                ))}
                                {categories.length === 0 && <SelectItem value="none" disabled>No categories created</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label>Compatible Models</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                            Search for models from the Master List. If you type a new model, it will be added to the Master List automatically.
                            Optionally add a "Contributor Name" if you are importing data from a known source.
                        </p>

                        {chainRows.map((row, index) => (
                            <div key={index} className="flex gap-2 items-start">
                                <div className="flex-1 space-y-1">
                                    <Combobox
                                        items={masterModels.map(m => ({ label: m, value: m }))}
                                        value={row.model}
                                        onChange={(val) => handleChainRowChange(index, "model", val)}
                                        placeholder="Model Name (e.g. iPhone 13)"
                                        creatable
                                    />
                                </div>
                                <div className="w-1/3">
                                    <Input
                                        placeholder="Contributor (Optional)"
                                        value={row.contributorName}
                                        onChange={(e) => handleChainRowChange(index, "contributorName", e.target.value)}
                                    />
                                </div>
                                {chainRows.length > 1 && (
                                    <Button variant="ghost" size="icon" onClick={() => removeChainRow(index)} className="text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}

                        <Button variant="outline" size="sm" onClick={addChainRow} className="w-full border-dashed">
                            <Plus className="h-4 w-4 mr-2" /> Add Another Model
                        </Button>
                    </div>

                    <Button onClick={handleCreateChain} disabled={creatingChain} className="w-full py-6">
                        {creatingChain ? <LoaderCircle className="animate-spin mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
                        Create Chain
                    </Button>
                </CardContent>
            </Card>

            <div className="border-t pt-8">
                <div className="mb-6">
                    <h2 className="font-headline text-2xl font-bold">Add to Existing Group</h2>
                    <p className="text-muted-foreground">Search for an existing group below and click "Contribute" to add a new model to it.</p>
                </div>
                <SearchClient masterModels={masterModels} showContributorInput={true} />
            </div>
        </div>
    );
}
