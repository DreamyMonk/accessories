'use client';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const newModelSchema = z.object({
  model: z.string().min(3, "Please enter a model name."),
});
type NewModelFormValues = z.infer<typeof newModelSchema>;

export function ContributeToGroupDialog({ result, open, onOpenChange }: { result: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<NewModelFormValues>({
    resolver: zodResolver(newModelSchema),
    defaultValues: { model: "" },
  });

  const onSubmit = async (data: NewModelFormValues) => {
    if (!firestore || !user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to contribute.",
        variant: "destructive",
      });
      return;
    }

    const contributionData = {
      accessoryType: result.accessoryType,
      models: [data.model], // This is an array with the single new model
      source: "User Contribution",
      status: "pending",
      submittedAt: serverTimestamp(),
      submittedBy: user.uid,
      addToAccessoryId: result.id, // Reference to the existing accessory
    };

    const contributionsCollectionRef = collection(firestore, "contributions");
    
    addDoc(contributionsCollectionRef, contributionData)
    .then(() => {
        toast({
          title: "Submission Received!",
          description: "Thank you for your contribution. It will be reviewed shortly.",
        });
        form.reset();
        onOpenChange(false); // Close dialog on success
    }).catch(error => {
        const permissionError = new FirestorePermissionError({
            path: contributionsCollectionRef.path,
            operation: 'create',
            requestResourceData: contributionData
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
            title: "Submission Failed",
            description: "Something went wrong. Please check your permissions and try again.",
            variant: "destructive",
        });
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
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>New Compatible Model</FormLabel>
                    <FormControl>
                    <Input placeholder="e.g., iPhone 17 Pro Max" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="ghost">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Submitting..." : "Submit for Review"}
                </Button>
            </DialogFooter>
            </form>
        </Form>
        </DialogContent>
    </Dialog>
  );
}
