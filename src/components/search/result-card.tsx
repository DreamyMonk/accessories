'use client';

import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, Copy, Share2, ShieldAlert, PlusCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useUser, useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const newModelSchema = z.object({
  model: z.string().min(3, "Please enter a model name."),
});
type NewModelFormValues = z.infer<typeof newModelSchema>;

function ContributeToGroupDialog({ result }: { result: any }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);

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
      brand: result.brand,
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
        setIsOpen(false); // Close dialog on success
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
    )
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Contribute to this Group</DialogTitle>
        <DialogDescription>
          Found another model that's compatible with the <span className="font-semibold">{result.brand} {result.accessoryType}</span>? Add it here.
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
            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Submitting..." : "Submit for Review"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}


export function ResultCard({ result, searchedModel, index }: { result: any, searchedModel: string, index: number }) {
  const [showAll, setShowAll] = useState(false);
  const { toast } = useToast();

  const mainModel = result.models.find((m: string) => m.toLowerCase() === searchedModel.toLowerCase()) || searchedModel;
  
  const otherModels = result.models.filter((m: string) => m.toLowerCase() !== searchedModel.toLowerCase());
  
  const topItems = otherModels.slice(0, 5);
  const remainingItems = otherModels.slice(5);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.models.join(', '));
    toast({
      title: "Copied!",
      description: "All compatible models copied to clipboard.",
    });
  };

  return (
    <Card
      className="animate-slide-up-fade"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <CardHeader>
        <div className="flex-1">
          <CardTitle className="font-headline text-xl uppercase tracking-wider">{mainModel}</CardTitle>
          <div className="flex items-center gap-2 mt-1">
             <Badge variant="secondary">{result.accessoryType}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {otherModels.length > 0 ? (
          <>
            <p className="font-semibold mb-2">Also compatible with:</p>
            <ul className="space-y-2">
              {topItems.map((model: string, i: number) => (
                <li key={i} className={cn("flex items-center gap-2 animate-slide-up-fade")} style={{ animationDelay: `${(index * 100) + (i * 50)}ms` }}>
                  <Check className="h-5 w-5 text-green-500" />
                  <span>{model}</span>
                </li>
              ))}
              {showAll && remainingItems.map((model: string, i: number) => (
                <li key={i} className="flex items-center gap-2 animate-slide-up-fade" style={{ animationDelay: '0ms' }}>
                  <Check className="h-5 w-5 text-green-500" />
                  <span>{model}</span>
                </li>
              ))}
            </ul>
            {remainingItems.length > 0 && (
              <Button variant="link" onClick={() => setShowAll(!showAll)} className="p-0 h-auto mt-2">
                {showAll ? 'Show less' : `Show ${remainingItems.length} more`}
              </Button>
            )}
          </>
        ) : (
            <p className="text-sm text-muted-foreground">No other compatible models have been added for this group yet.</p>
        )}
      </CardContent>
      <Separator className="my-4" />
      <CardFooter className="flex-col items-start gap-4">
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button variant="secondary" onClick={handleCopy}><Copy className="mr-2 h-4 w-4" /> Copy List</Button>
            <Button variant="outline"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
            <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive"><ShieldAlert className="mr-2 h-4 w-4"/> Report</Button>
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Contribute</Button>
                </DialogTrigger>
                <ContributeToGroupDialog result={result} />
            </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
}
