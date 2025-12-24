'use client';
import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Label } from '@/components/ui/label';

export function ContributeToGroupDialog({ result, open, onOpenChange }: { result: any, open: boolean, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const [modelName, setModelName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredModels = result.models.filter((model: any) => {
        return typeof model === 'string' && model.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const showCustomModelInput = searchTerm.length > 0 && filteredModels.length === 0;

    useEffect(() => {
        if (showCustomModelInput) {
            setModelName(searchTerm);
        }
    }, [showCustomModelInput, searchTerm]);

    const onSubmit = async () => {
        if (!firestore || !user) {
            toast({ title: "Not logged in", description: "You must be logged in to contribute.", variant: "destructive" });
            return;
        }

        const modelToSubmit = modelName.trim();

        if (modelToSubmit.length < 3) {
            toast({ title: "Invalid model name", description: "Please enter a model name with at least 3 characters.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);

        const contributionData = {
            accessoryType: result.accessoryType,
            models: [modelToSubmit],
            isNewModel: true,
            source: "User Contribution",
            status: "pending",
            submittedAt: serverTimestamp(),
            submittedBy: user.uid,
            addToAccessoryId: result.id,
        };

        const contributionsCollectionRef = collection(firestore, "contributions");

        addDoc(contributionsCollectionRef, contributionData)
            .then(() => {
                toast({ title: "Submission Received!", description: "Thank you for your contribution. It will be reviewed shortly." });
                setModelName('');
                setSearchTerm('');
                setIsSubmitting(false);
                onOpenChange(false);
            }).catch(error => {
                const permissionError = new FirestorePermissionError({ path: contributionsCollectionRef.path, operation: 'create', requestResourceData: contributionData });
                errorEmitter.emit('permission-error', permissionError);
                toast({ title: "Submission Failed", description: "Something went wrong. Please check your permissions and try again.", variant: "destructive" });
                setIsSubmitting(false);
            });
    };

    if (!user) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Contribute to this Group</DialogTitle>
                        <DialogDescription>
                            You need to be signed in to add a model to this compatibility group.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-start">
                        <DialogClose asChild>
                            <Button asChild>
                                <Link href="/login">Sign In to Contribute</Link>
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Contribute to this Group</DialogTitle>
                    <DialogDescription>
                        Found another model that's compatible with the <span className="font-semibold">{result.accessoryType}</span>? Add it here.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">

                    <div className="space-y-2">
                        <Label htmlFor="search-models">Search for a model to add</Label>
                        <Input
                            id="search-models"
                            placeholder="Search existing models..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm.length > 0 &&
                            <div className="max-h-48 overflow-y-auto rounded-md border bg-muted/50">
                                {filteredModels.length > 0 ? (
                                    filteredModels.map((model: string) => (
                                        <div
                                            key={model}
                                            className="cursor-pointer p-2 hover:bg-accent"
                                            onClick={() => {
                                                setModelName(model)
                                                setSearchTerm(model)
                                            }}
                                        >
                                            {model}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-2 text-sm text-muted-foreground">No matching models found.</div>
                                )}
                            </div>
                        }
                    </div>

                    {showCustomModelInput && (
                        <div className="space-y-2">
                            <Label htmlFor="model-name">Enter the model name</Label>
                            <Input
                                id="model-name"
                                placeholder="e.g., iPhone 17 Pro Max"
                                value={modelName}
                                onChange={(e) => setModelName(e.target.value)}
                            />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={onSubmit} disabled={modelName.trim().length < 3 || isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit for Review"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}