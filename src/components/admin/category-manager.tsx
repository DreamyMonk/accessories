'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, query, orderBy, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


const categorySchema = z.object({
  name: z.string().min(3, 'Category name must be at least 3 characters.'),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export function CategoryManager() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [categoryToDelete, setCategoryToDelete] = useState<{id: string, name: string} | null>(null);

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

  const handleDelete = async (categoryId: string) => {
    if (!firestore) return;
    const categoryDocRef = doc(firestore, 'categories', categoryId);

    deleteDoc(categoryDocRef)
      .then(() => {
        toast({
          title: 'Category Deleted',
          description: 'The category has been removed.',
        });
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
          path: categoryDocRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
          title: 'Failed to Delete',
          description: 'Could not delete category. Check permissions.',
          variant: 'destructive',
        });
      });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Categories</CardTitle>
        <CardDescription>Add or remove accessory categories.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
            <h4 className="font-medium mb-2">Existing Categories</h4>
            <div className="flex flex-wrap gap-2">
                {categoriesLoading && <Skeleton className="w-full h-8" />}
                {categories && categories.length > 0 ? (
                    <AlertDialog>
                        {categories.map(cat => (
                            <Badge key={cat.id} variant="secondary" className="group relative pr-6">
                                {cat.name}
                                <AlertDialogTrigger asChild>
                                    <button 
                                        onClick={() => setCategoryToDelete(cat)}
                                        className="absolute right-0.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground opacity-50 transition-opacity hover:opacity-100 group-hover:opacity-100"
                                    >
                                        <X className="h-3 w-3" />
                                        <span className="sr-only">Delete category</span>
                                    </button>
                                </AlertDialogTrigger>
                            </Badge>
                        ))}
                         <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the 
                                    <span className="font-semibold"> "{categoryToDelete?.name}"</span> category.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => categoryToDelete && handleDelete(categoryToDelete.id)}>
                                    Continue
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                ) : <p className="text-sm text-muted-foreground">No categories yet.</p>}
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
