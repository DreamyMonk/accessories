'use client';
import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { addDoc, collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
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

interface ContributeToGroupDialogProps {
    isOpen: boolean;
    onClose: () => void;
    accessoryId: string;
    accessoryType: string;
    existingModels: string[];
    showContributorInput?: boolean;
}

export function ContributeToGroupDialog({
    isOpen,
    onClose,
    accessoryId,
    accessoryType,
    existingModels = [],
    showContributorInput = false
}: ContributeToGroupDialogProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const [modelName, setModelName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [contributorName, setContributorName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Master Models only when dialog is open
    const masterModelsQuery = useMemo(() => {
        if (!firestore || !isOpen) return null;
        return query(collection(firestore, 'master_models'), orderBy('name', 'asc'));
    }, [firestore, isOpen]);

    const { data: masterModelDocs } = useCollection(masterModelsQuery);

    const filteredModels = useMemo(() => {
        if (!masterModelDocs || searchTerm.length === 0) return [];

        const searchLower = searchTerm.toLowerCase();
        // Safety: Ensure existingModels is an array
        const safeExistingModels = Array.isArray(existingModels) ? existingModels : [];

        return masterModelDocs
            .map((doc: any) => doc.name as string)
            .filter((name) => {
                // 1. Must match search term
                if (!name.toLowerCase().includes(searchLower)) return false;

                // 2. Must NOT be in the current group already
                const isAlreadyInGroup = safeExistingModels.some((existingName) =>
                    existingName.toLowerCase() === name.toLowerCase()
                );

                return !isAlreadyInGroup;
            });
    }, [masterModelDocs, searchTerm, existingModels]);

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

        const contributionData: any = {
            accessoryType: accessoryType,
            models: [modelToSubmit],
            isNewModel: true,
            source: "User Contribution",
            status: "pending",
            submittedAt: serverTimestamp(),
            submittedBy: user.uid,
            addToAccessoryId: accessoryId,
        };

        if (showContributorInput && contributorName.trim()) {
            contributionData.contributorName = contributorName.trim();
        }

        const contributionsCollectionRef = collection(firestore, "contributions");

        addDoc(contributionsCollectionRef, contributionData)
            .then(() => {
                toast({ title: "Submission Received!", description: "Thank you for your contribution. It will be reviewed shortly." });
                setModelName('');
                setSearchTerm('');
                setContributorName('');
                setIsSubmitting(false);
                onClose();
            }).catch(error => {
                const permissionError = new FirestorePermissionError({ path: contributionsCollectionRef.path, operation: 'create', requestResourceData: contributionData });
                errorEmitter.emit('permission-error', permissionError);
                toast({ title: "Submission Failed", description: "Something went wrong. Please check your permissions and try again.", variant: "destructive" });
                setIsSubmitting(false);
            });
    };

    if (!user) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Contribute to this Group</DialogTitle>
                    <DialogDescription>
                        Found another model that's compatible with the <span className="font-semibold">{accessoryType}</span>? Add it here.
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

                    {showContributorInput && (
                        <div className="space-y-2">
                            <Label htmlFor="contributor-name">Contributor Name (Optional)</Label>
                            <Input
                                id="contributor-name"
                                placeholder="Enter contributor name"
                                value={contributorName}
                                onChange={(e) => setContributorName(e.target.value)}
                            />
                            <p className="text-[10px] text-muted-foreground">This name will be credited for this model.</p>
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