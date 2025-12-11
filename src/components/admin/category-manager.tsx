'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { useMemo } from 'react';

const categorySchema = z.object({
  name: z.string().min(3, 'Category name must be at least 3 characters.'),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export function CategoryManager() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const categoriesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'categories'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: categories, loading: categoriesLoading } = useCollection(categoriesQuery);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' },
  });

  const onSubmit = async (data: CategoryFormValues) => {
    if (!firestore) return;

    const categoryData = {
      name: data.name,
      createdAt: serverTimestamp(),
    };
    
    const categoryCollectionRef = collection(firestore, 'categories');

    addDoc(categoryCollectionRef, categoryData)
      .then(() => {
        toast({
          title: 'Category Added!',
          description: `${data.name} has been added.`,
        });
        form.reset();
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
          path: categoryCollectionRef.path,
          operation: 'create',
          requestResourceData: categoryData,
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
          title: 'Failed to Add Category',
          description: 'Please check your permissions.',
          variant: 'destructive',
        });
      });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Categories</CardTitle>
        <CardDescription>Add new accessory categories.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
            <h4 className="font-medium mb-2">Existing Categories</h4>
            <div className="flex flex-wrap gap-2">
                {categoriesLoading && <Skeleton className="w-full h-8" />}
                {categories && categories.length > 0 ? categories.map(cat => (
                    <Badge key={cat.id} variant="secondary">{cat.name}</Badge>
                )) : <p className="text-sm text-muted-foreground">No categories yet.</p>}
            </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Screen Protectors" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Adding...' : 'Add Category'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
