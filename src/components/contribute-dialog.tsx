'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
<<<<<<< HEAD
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Combobox } from '@/components/ui/combobox';
=======
import { createSubmission } from '@/app/admin/submissions/actions';
import { useToast } from '@/hooks/use-toast';
import { Combobox } from '@/components/ui/combobox'; // Assuming a combobox component exists
>>>>>>> fbc44eec518ddf89dd9fad935fe552e6bfd55d26

export function ContributeDialog({ accessoryType, masterModels }: { accessoryType: string, masterModels: string[] }) {
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
<<<<<<< HEAD
  const { user } = useUser();
  const firestore = useFirestore();

  const handleSubmit = async () => {
    if (!model.trim()) {
      toast({ title: "Model name is required.", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Authentication required", description: "Please sign in to submit a contribution.", variant: "destructive" });
      return;
    }

    if (!firestore) {
      toast({ title: "System Error", description: "Database connection not available.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'contributions'), {
        accessoryType,
        models: [model.trim()],
        submittedBy: user.uid,
        submittedAt: serverTimestamp(),
        status: 'pending',
        source: 'User Submission'
      });

      toast({ title: "Submission successful!", description: "Thank you for your contribution. It will be reviewed shortly." });
      setOpen(false);
      setModel("");
    } catch (error) {
      console.error("Submission error:", error);
      toast({ title: "Submission failed.", description: "Could not save your contribution. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
=======

  const handleSubmit = async () => {
    if (!model.trim()) {
        toast({ title: "Model name is required.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    const result = await createSubmission(model, accessoryType);
    if (result.success) {
      toast({ title: "Submission successful!", description: "Thank you for your contribution. It will be reviewed shortly." });
      setOpen(false);
    } else {
      toast({ title: "Submission failed.", description: result.error, variant: "destructive" });
    }
    setIsSubmitting(false)
>>>>>>> fbc44eec518ddf89dd9fad935fe552e6bfd55d26
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Contribute</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contribute to {accessoryType}</DialogTitle>
          <DialogDescription>
            Can't find your model? Add it to our database.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
<<<<<<< HEAD
          <Label htmlFor="model-name">Model Name</Label>
          <Combobox
            items={masterModels.map(m => ({ label: m, value: m }))}
            value={model}
            onChange={setModel}
            placeholder="Search or add new model..."
            creatable
          />
=======
            <Label htmlFor="model-name">Model Name</Label>
            <Combobox
                items={masterModels.map(m => ({ label: m, value: m }))}
                value={model}
                onChange={setModel}
                placeholder="Search or add new model..."
                creatable
            />
>>>>>>> fbc44eec518ddf89dd9fad935fe552e6bfd55d26
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
