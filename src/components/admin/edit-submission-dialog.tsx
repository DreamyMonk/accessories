'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const editSchema = z.object({
  accessoryType: z.string().min(3, 'Accessory type must be at least 3 characters.'),
  models: z.string().min(3, 'Please list at least one model.'),
});

type EditFormValues = z.infer<typeof editSchema>;

export function EditSubmissionDialog({
  contribution,
  open,
  onOpenChange,
}: {
  contribution: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      accessoryType: contribution?.accessoryType || '',
      models: contribution?.models.join('\n') || '',
    },
  });

  const onSubmit = async (data: EditFormValues) => {
    if (!firestore || !contribution) return;

    const contributionRef = doc(firestore, 'contributions', contribution.id);
    const updatedData = {
        ...data,
        models: data.models.split('\n').map((m) => m.trim()).filter(Boolean),
    }

    updateDoc(contributionRef, updatedData)
      .then(() => {
        toast({
          title: 'Submission Updated',
          description: 'The changes have been saved.',
        });
        onOpenChange(false);
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: contributionRef.path,
          operation: 'update',
          requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
          title: 'Update Failed',
          description: 'Could not update submission. Check permissions.',
          variant: 'destructive',
        });
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Submission</DialogTitle>
          <DialogDescription>
            Correct any mistakes before approving the submission.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="accessoryType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accessory Type</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="models"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compatible Models</FormLabel>
                  <FormControl>
                    <Textarea rows={5} {...field} />
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
                    {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
