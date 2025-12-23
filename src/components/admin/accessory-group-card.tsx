'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFirestore } from '@/firebase';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { XIcon } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Model {
    name: string;
    contributorName?: string;
}

export function AccessoryGroupCard({ accessory }: { accessory: any }) {
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const firestore = useFirestore();
    const { toast } = useToast();

    const getModelName = (model: string | Model): string => {
        return typeof model === 'string' ? model : model.name;
    }

    const handleDelete = async (modelToDelete: string | Model) => {
        if (!firestore) return;
        
        const modelName = getModelName(modelToDelete);
        setIsDeleting(modelName);

        try {
            const accessoryRef = doc(firestore, 'accessories', accessory.id);
            await updateDoc(accessoryRef, {
                models: arrayRemove(modelToDelete)
            });

            toast({ title: "Model Removed", description: `Model \"${modelName}\" was successfully removed.` });
        } catch (error) {
            console.error("Error removing model:", error);
            toast({ title: "Error", description: "An error occurred while removing the model.", variant: "destructive" });
        }

        setIsDeleting(null);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-headline">{accessory.accessoryType}</CardTitle>
                <p className="text-sm text-muted-foreground">ID: {accessory.id}</p>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2">
                    {accessory.models.map((model: string | Model, index: number) => (
                        <AlertDialog key={index}>
                            <AlertDialogTrigger asChild>
                                <Badge 
                                    variant="secondary" 
                                    className="group relative cursor-pointer hover:bg-destructive/80 transition-colors"
                                >
                                    {getModelName(model)}
                                    <span className="absolute top-0 right-0 h-full w-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                       <XIcon className="h-3 w-3 text-destructive-foreground" />
                                    </span>
                                </Badge>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will permanently remove the model "<b>{getModelName(model)}</b>" from this accessory group. This cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(model)}>
                                        {isDeleting === getModelName(model) ? 'Deleting...' : 'Delete'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
