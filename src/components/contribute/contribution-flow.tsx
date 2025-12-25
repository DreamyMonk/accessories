'use client';

import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { SearchClient } from '@/components/search/search-client';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, LoaderCircle, CheckCircle2 } from 'lucide-react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Combobox } from '@/components/ui/combobox';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ContributionFlow() {
    const [activeTab, setActiveTab] = useState("existing");
    const [inputs, setInputs] = useState<string[]>(['', '']); // Start with 2 inputs
    const [accessoryType, setAccessoryType] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [successId, setSuccessId] = useState<string | null>(null);
    const [categories, setCategories] = useState<any[]>([]);

    // Fetch Categories
    useEffect(() => {
        if (!firestore) return;
        const q = query(collection(firestore, "categories"), orderBy("name", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCategories(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, [firestore]);

    // Fetch Master Models
    const masterModelsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'master_models'), orderBy('name', 'asc'));
    }, [firestore]);

    const { data: masterModelDocs } = useCollection(masterModelsQuery);

    const masterModels = useMemo(() => {
        return masterModelDocs?.map(d => d.name as string) || [];
    }, [masterModelDocs]);

    const handleAddInput = () => {
        setInputs([...inputs, '']);
    };

    const handleRemoveInput = (index: number) => {
        const newInputs = [...inputs];
        newInputs.splice(index, 1);
        setInputs(newInputs);
    };

    const handleInputChange = (index: number, value: string) => {
        const newInputs = [...inputs];
        newInputs[index] = value;
        setInputs(newInputs);
    };

    const handleSubmitNewChain = async () => {
        if (!user) {
            toast({ title: "Login Required", description: "You must be logged in to contribute.", variant: "destructive" });
            return;
        }
        if (!firestore) return;

        const validModels = inputs.map(m => m.trim()).filter(Boolean);

        if (!accessoryType) {
            toast({ title: "Missing Information", description: "Please select an accessory category.", variant: "destructive" });
            return;
        }

        if (validModels.length < 2) {
            toast({ title: "Not enough models", description: "A chain needs at least 2 compatible models to be useful.", variant: "destructive" });
            return; // Enforce at least 2 for a "chain"
        }

        setIsSubmitting(true);
        try {
            const docRef = await addDoc(collection(firestore, 'contributions'), {
                accessoryType: accessoryType,
                models: validModels,
                submittedBy: user.uid,
                submittedAt: serverTimestamp(),
                status: 'pending',
                source: 'User Chain Creation'
            });

            setSuccessId(docRef.id);
            setInputs(['', '']);
            setAccessoryType('');
            toast({ title: "Contribution Sent!", description: "Your new compatibility chain is pending review." });

        } catch (error) {
            console.error("Error submitting chain:", error);
            toast({ title: "Error", description: "Failed to submit contribution.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (successId) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <CheckCircle2 className="h-20 w-20 text-green-500 animate-bounce" />
                <h2 className="text-3xl font-bold font-headline">Thank You!</h2>
                <p className="text-muted-foreground text-center max-w-md">
                    Your contribution has been submitted for review. You can track its status in your profile or submit another one.
                </p>
                <div className="flex gap-4">
                    <Button onClick={() => setSuccessId(null)} variant="outline">Submit Another</Button>
                    <Link href="/my-contributions">
                        <Button>View My Contributions</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-14 p-1">
                <TabsTrigger value="existing" className="text-lg h-full rounded-md">Add to Existing Chain</TabsTrigger>
                <TabsTrigger value="new" className="text-lg h-full rounded-md">Create New Chain</TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold font-headline">Find an Existing Group</h2>
                    <p className="text-muted-foreground">Search for a model to see compatibility groups, then add your model to it.</p>
                </div>
                {/* Reuse Search Client */}
                <SearchClient />
            </TabsContent>

            <TabsContent value="new" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Create Compatibility Chain</CardTitle>
                        <CardDescription>
                            Found a group of devices that share an accessory? Link them together here.
                            If a model doesn't exist in our list, type it in and we'll add it!
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Accessory Category</Label>
                            <Select value={accessoryType} onValueChange={setAccessoryType}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select Category..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                    ))}
                                    {categories.length === 0 && <SelectItem value="none" disabled>No categories available</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <Label>Compatible Models (Add at least 2)</Label>
                            {inputs.map((input, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <div className="flex-1">
                                        <Combobox
                                            items={masterModels.map(m => ({ label: m, value: m }))}
                                            value={input}
                                            onChange={(val) => handleInputChange(index, val)}
                                            placeholder={`Model ${index + 1} (e.g. iPhone 13)`}
                                            creatable
                                        />
                                    </div>
                                    {inputs.length > 2 && (
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveInput(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                            ))}

                            <Button variant="outline" onClick={handleAddInput} className="w-full border-dashed">
                                <Plus className="h-4 w-4 mr-2" /> Add Another Model
                            </Button>
                        </div>

                        {!user && (
                            <Alert variant="destructive">
                                <AlertTitle>Login Required</AlertTitle>
                                <AlertDescription>Please sign in (top right) to submit contributions.</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full h-12 text-lg"
                            onClick={handleSubmitNewChain}
                            disabled={isSubmitting || !user}
                        >
                            {isSubmitting ? <LoaderCircle className="animate-spin mr-2" /> : null}
                            Submit Chain for Review
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
