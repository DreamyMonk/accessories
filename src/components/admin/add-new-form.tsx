'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, LoaderCircle } from "lucide-react";
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AdminResultCard } from './admin-result-card';
import { Textarea } from "@/components/ui/textarea"; // Assuming Textarea exists, otherwise Input
import { Label } from "@/components/ui/label";
import { addMasterModel } from '@/app/admin/master-models/actions';

export function AddNewForm({ masterModels }: { masterModels: string[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[] | null>(null);

    // New Chain States
    const [newChainType, setNewChainType] = useState('');
    const [newChainModels, setNewChainModels] = useState('');
    const [creatingChain, setCreatingChain] = useState(false);

    const firestore = useFirestore();
    const { toast } = useToast();

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

    const handleCreateChain = async () => {
        if (!firestore || !newChainType.trim() || !newChainModels.trim()) {
            toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
            return;
        }

        setCreatingChain(true);
        try {
            const modelsList = newChainModels.split(',').map(m => m.trim()).filter(Boolean);

            // Add to master models
            for (const m of modelsList) {
                await addMasterModel(m);
            }

            const structuredModels = modelsList.map(m => ({
                name: m,
                contributorUid: 'admin' // Admin created
            }));

            await addDoc(collection(firestore, 'accessories'), {
                accessoryType: newChainType.trim(),
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
            setNewChainModels('');

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
                        Start a fresh group of compatible models (e.g., "Screen A" fits iPhone 11, 12, Vivo V6).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Accessory Type</Label>
                        <Input
                            placeholder="e.g. Tempered Glass, Back Case, Camera Lens..."
                            value={newChainType}
                            onChange={(e) => setNewChainType(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Compatible Models</Label>
                        <Textarea
                            placeholder="Enter models separated by commas (e.g. iPhone 11, iPhone 12, Vivo V6)"
                            value={newChainModels}
                            onChange={(e) => setNewChainModels(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">These models will be linked together as fully compatible with this accessory.</p>
                    </div>
                    <Button onClick={handleCreateChain} disabled={creatingChain} className="w-full">
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
