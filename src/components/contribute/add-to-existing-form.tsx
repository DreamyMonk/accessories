'use client';
import { useState, useMemo } from 'react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Search } from 'lucide-react';
import { ContributeToGroupDialog } from './contribute-to-group-dialog';
import type { Accessory } from '@/lib/types';


export function AddToExistingForm() {
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');
    const [submittedSearch, setSubmittedSearch] = useState('');
    const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const accessoriesQuery = useMemo(() => {
        if (!firestore || !submittedSearch) return null;

        const allCapsQuery = query(
            collection(firestore, 'accessories'),
            where('brand', '>=', submittedSearch.toUpperCase()),
            where('brand', '<=', submittedSearch.toUpperCase() + '\uf8ff')
        );

        // This is a simplified search. A more robust solution might use a dedicated search service.
        return query(
            collection(firestore, 'accessories'),
            where('brand', '>=', submittedSearch),
            where('brand', '<=', submittedSearch + '\uf8ff')
        );
    }, [firestore, submittedSearch]);

    const { data: accessories, loading } = useCollection(accessoriesQuery);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittedSearch(searchTerm);
    }
    
    const handleSelectAccessory = (accessory: Accessory) => {
        setSelectedAccessory(accessory);
        setIsDialogOpen(true);
    }

    const onDialogClose = () => {
        setIsDialogOpen(false);
        // Reset state so a new contribution can be made
        setSelectedAccessory(null); 
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl">Add a Model to an Existing Group</CardTitle>
                <CardDescription>
                    First, search for an accessory group by its brand. Then you can add a new compatible model to it.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                    <Input 
                        placeholder="Search for a brand..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button type="submit" disabled={loading}><Search className="mr-2 h-4 w-4" /> Search</Button>
                </form>

                <div className="space-y-2">
                    {loading && (
                        <>
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </>
                    )}
                    {!loading && accessories && accessories.length === 0 && submittedSearch && (
                        <p className="text-sm text-muted-foreground text-center py-4">No results found for "{submittedSearch}".</p>
                    )}
                    {!loading && accessories && accessories.map(acc => (
                        <div key={acc.id} className="p-3 border rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{acc.brand} {acc.accessoryType}</p>
                                <p className="text-xs text-muted-foreground">{acc.models.length} compatible models</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleSelectAccessory(acc)}>Add Model</Button>
                        </div>
                    ))}
                </div>

                {selectedAccessory && (
                     <ContributeToGroupDialog 
                        result={selectedAccessory} 
                        open={isDialogOpen} 
                        onOpenChange={onDialogClose} 
                    />
                )}
            </CardContent>
        </Card>
    );
}
