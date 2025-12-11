'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const accessorySchema = z.object({
  primaryModel: z.string().min(3, 'Primary model must be at least 3 characters.'),
  accessoryType: z.string().min(3, 'Please select an accessory type.'),
  compatibleModels: z.string().min(3, 'Please list at least one model.'),
  brand: z.string().min(2, 'Brand must be at least 2 characters.'),
  source: z.string().url().optional().or(z.literal('')),
});

type AccessoryFormValues = z.infer<typeof accessorySchema>;

interface ManualAddFormProps {
  categories: string[];
}

export function ManualAddForm({ categories }: ManualAddFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<AccessoryFormValues>({
    resolver: zodResolver(accessorySchema),
    defaultValues: {
      primaryModel: '',
      accessoryType: '',
      compatibleModels: '',
      brand: '',
      source: '',
    },
  });

  const onSubmit = async (data: AccessoryFormValues) => {
    if (!firestore) return;

    const accessoryData = {
      ...data,
      compatibleModels: data.compatibleModels.split('\n').map((m) => m.trim()).filter(Boolean),
      lastUpdated: serverTimestamp(),
      contributor: {
        name: 'Admin',
        points: 0,
      },
      source: data.source || 'Manual Entry',
    };
    
    const accessoryCollectionRef = collection(firestore, 'accessories');

    addDoc(accessoryCollectionRef, accessoryData)
      .then(() => {
        toast({
          title: 'Accessory Added!',
          description: `${data.primaryModel} has been added to the database.`,
        });
        form.reset();
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: accessoryCollectionRef.path,
          operation: 'create',
          requestResourceData: accessoryData,
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
          title: 'Submission Failed',
          description: 'Something went wrong. Please check permissions and try again.',
          variant: 'destructive',
        });
      });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="primaryModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Model</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., iPhone 15 Pro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Apple" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="accessoryType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Accessory Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an accessory type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="compatibleModels"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Compatible Models</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter each compatible model on a new line."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Link to product page or other source"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Adding...' : 'Add Accessory'}
        </Button>
      </form>
    </Form>
  );
}
