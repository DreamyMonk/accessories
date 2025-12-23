'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AdminResultCard } from './admin-result-card';

export function AddNewForm({ masterModels }: { masterModels: string[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[] | null>(null);
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore) return;

        setLoading(true);
        setResults(null);

        try {
            const accessoriesRef = collection(firestore, 'accessories');
            const q = query(accessoriesRef, where('models', 'array-contains', searchTerm));
            const querySnapshot = await getDocs(q);
            
            const searchResults: any[] = [];
            querySnapshot.forEach((doc) => {
                searchResults.push({ id: doc.id, ...doc.data() });
            });

            if(searchResults.length === 0) {
                 const allAccessoriesSnapshot = await getDocs(collection(firestore, "accessories"));
                 const allAccessories = allAccessoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                 const fuzzyResults = allAccessories.filter(acc => 
                    acc.models.some((m: any) => 
                        typeof m === 'string' && m.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                 );
                 setResults(fuzzyResults);
                 if(fuzzyResults.length === 0) {
                    toast({ title: "No results found", description: "Try a different model name." });
                 }
            } else {
                setResults(searchResults);
            }

        } catch (error) {
            console.error("Error searching for accessories:", error);
            toast({ title: "Error", description: "An error occurred while searching.", variant: "destructive" });
        }

        setLoading(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl">Add a Model to an Existing Group</CardTitle>
                <CardDescription>
                    First, search for an accessory group by a model name. Then you can add a new compatible model to it.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                    <Input 
                        placeholder="Search for a model..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button type="submit" disabled={loading}><Search className="mr-2 h-4 w-4" /> Search</Button>
                </form>

                {loading && <p>Loading...</p>}

                {results && (
                    <div className="space-y-4">
                        <h2 className="font-bold">Search Results ({results.length})</h2>
                        {results.map(result => (
                           <AdminResultCard key={result.id} result={result} masterModels={masterModels} />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
