'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, LoaderCircle, Trash2 } from "lucide-react";
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AdminResultCard } from './admin-result-card';
import { Label } from "@/components/ui/label";
import { addMasterModel } from '@/app/admin/master-models/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";

export function AddNewForm({ masterModels }: { masterModels: string[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[] | null>(null);
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

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore) return;

        setLoading(true);
        setResults(null);

        try {
            const accessoriesRef = collection(firestore, 'accessories');
            // Try explicit array-contains if exact match
            let q = query(accessoriesRef, where('models', 'array-contains', searchTerm));
            let querySnapshot = await getDocs(q);

            let searchResults: any[] = [];

            if (querySnapshot.empty) {
                // Fallback to client-side fuzzy search if Firestore explicit search fails (common with object arrays)
                const allDocs = await getDocs(collection(firestore, "accessories"));
                searchResults = allDocs.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter((acc: any) =>
                        acc.models && acc.models.some((m: any) =>
                            (typeof m === 'string' ? m : m.name).toLowerCase().includes(searchTerm.toLowerCase())
                        )
                    );
            } else {
                querySnapshot.forEach((doc) => {
                    searchResults.push({ id: doc.id, ...doc.data() });
                });
            }

            setResults(searchResults);
            if (searchResults.length === 0) {
                toast({ title: "No results found", description: "Try a different model name." });
            }

        } catch (error) {
            console.error("Error searching for accessories:", error);
            toast({ title: "Error", description: "An error occurred while searching.", variant: "destructive" });
        }

        setLoading(false);
    };

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
        <div className="space-y-8">
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

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-xl">Add a Model to an Existing Group</CardTitle>
                    <CardDescription>
                        Search for an EXISTING compatibility chain by one of its models, then add a NEW model to it.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                        <Input
                            placeholder="Search for a model already in the chain..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Button type="submit" disabled={loading}><Search className="mr-2 h-4 w-4" /> Search</Button>
                    </form>

                    {loading && <p>Loading...</p>}

                    {results && (
                        <div className="space-y-4">
                            <h2 className="font-bold">Found Chains ({results.length})</h2>
                            {results.map(result => (
                                <AdminResultCard key={result.id} result={result} masterModels={masterModels} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
