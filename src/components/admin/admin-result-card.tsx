'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function AdminResultCard({ result, masterModels }: { result: any, masterModels: string[] }) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newModel, setNewModel] = useState('');
    const [manualModel, setManualModel] = useState('');
    const [contributor, setContributor] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const getModelName = (model: any): string => {
        if (typeof model === 'string') return model;
        return model?.name || '';
    }

    const handleSave = async () => {
        if (!firestore) return;

        const modelToAdd = manualModel || newModel;
        if (!modelToAdd) {
            toast({ title: "Error", description: "Please select or enter a model to add.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);

        try {
            const accessoryRef = doc(firestore, 'accessories', result.id);
            
            let modelObject: any = { name: modelToAdd };
            if (contributor) {
                modelObject.contributorName = contributor;
            }

            await updateDoc(accessoryRef, {
                models: arrayUnion(modelObject)
            });

            toast({ title: "Success!", description: `Model \"${modelToAdd}\" added successfully.` });
            setShowAddForm(false);
            setNewModel('');
            setManualModel('');
            setContributor('');
        } catch (error) {
            console.error("Error updating accessory:", error);
            toast({ title: "Error", description: "An error occurred while saving the model.", variant: "destructive" });
        }

        setIsSubmitting(false);
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold">{result.accessoryType}</h3>
                        <div className="flex flex-wrap gap-1 mt-2">
                           {result.models.map((model: any, index: number) => (
                                <Badge key={index} variant="secondary">{getModelName(model)}</Badge>
                           ))}
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
                        {showAddForm ? 'Cancel' : 'Add New Model'}
                    </Button>
                </div>

                {showAddForm && (
                    <div className="mt-4 p-4 border rounded-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Select from Master List</label>
                                <Select onValueChange={setNewModel} value={newModel}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {masterModels.map(model => (
                                            <SelectItem key={model} value={model}>{model}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div>
                                <label className="text-sm font-medium">Or Add Manually</label>
                                <Input 
                                    placeholder="e.g., iPhone 16 Pro Max"
                                    value={manualModel}
                                    onChange={(e) => setManualModel(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="text-sm font-medium">Contributor Name (Optional)</label>
                            <Input 
                                placeholder="e.g., John Doe"
                                value={contributor}
                                onChange={(e) => setContributor(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
            {showAddForm && (
                <CardFooter className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
