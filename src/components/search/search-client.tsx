'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ArrowRight, LoaderCircle } from 'lucide-react';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ResultCard } from '@/components/search/result-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '../ui/card';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Accessory } from '@/lib/types';
import { format } from 'date-fns';

const searchSchema = z.object({
  searchTerm: z.string(),
});

type SearchFormValues = z.infer<typeof searchSchema>;

export function SearchClient() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Accessory[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const firestore = useFirestore();

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      searchTerm: '',
    },
    mode: 'onChange',
  });

  const categoriesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'categories'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: categories, loading: categoriesLoading } = useCollection(categoriesQuery);

  useEffect(() => {
    if (categories && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].name);
    }
  }, [categories, activeCategory]);

  const accessoriesQuery = useMemo(() => {
    if (!firestore || !activeCategory) return null;
    return query(
      collection(firestore, 'accessories'),
      where('accessoryType', '==', activeCategory)
    );
  }, [firestore, activeCategory]);

  const { data: accessories, loading: accessoriesLoading } =
    useCollection(accessoriesQuery);

  useEffect(() => {
    if(!accessoriesLoading){
        setIsLoading(false)
    }
  },[accessoriesLoading])

  const performSearch = useCallback(
    async (currentSearchTerm: string) => {
      if (!accessories) {
        setResults(null);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setHasSearched(true);
      setResults(null);

      await new Promise(resolve => setTimeout(resolve, 300));

      if (currentSearchTerm.length < 2) {
        const filtered = accessories.filter(acc => acc.accessoryType === activeCategory);
        setResults(filtered);
        setIsLoading(false);
        return;
      }
      
      const searchLower = currentSearchTerm.toLowerCase();
      const filteredResults = accessories.filter(
        (acc) =>
          acc.accessoryType === activeCategory &&
          (acc.primaryModel.toLowerCase().includes(searchLower) ||
          (acc.brand && acc.brand.toLowerCase().includes(searchLower)) ||
          acc.compatibleModels.some(m => m.toLowerCase().includes(searchLower)))
      );
      
      setResults(filteredResults);
      setIsLoading(false);
    },
    [accessories, activeCategory]
  );
  

  const onSubmit = (data: SearchFormValues) => {
    performSearch(data.searchTerm);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    form.setValue('searchTerm', '');
    setResults(null);
    setHasSearched(false);
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return format(timestamp.toDate(), 'yyyy-MM-dd');
    }
    return 'N/A';
  }

  return (
    <div className="space-y-8">
      <section id="search" className="scroll-mt-20">
        <div className="text-center mb-8">
          <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">
            Accessory Compatibility Finder
          </h1>
          <p className="text-muted-foreground mt-2">
            Instantly find compatible accessories for any phone model.
          </p>
        </div>

        {categoriesLoading ? (
            <div className="flex justify-center w-full space-x-2 pb-4">
                <Skeleton className="h-10 w-24 rounded-full" />
                <Skeleton className="h-10 w-32 rounded-full" />
                <Skeleton className="h-10 w-28 rounded-full" />
            </div>
        ) : (
        <ScrollArea className="w-full whitespace-nowrap rounded-md">
          <div className="flex justify-center w-full space-x-2 pb-4">
            {categories?.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.name ? 'default' : 'outline'}
                className="rounded-full transition-all duration-200"
                onClick={() => handleCategoryChange(category.name)}
              >
                {category.name}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        )}

        <Card
          className="mt-4 shadow-lg"
          style={{ boxShadow: '0 6px 18px rgba(11, 132, 255, 0.08)' }}
        >
          <CardContent className="p-4 md:p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="searchTerm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Search for {activeCategory}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Samsung Galaxy S23 Ultra"
                          {...field}
                          disabled={!activeCategory}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <Button type="submit" className="w-full text-lg py-6" disabled={isLoading || !activeCategory}>
                  {isLoading ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <>
                      Check Compatibility <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                 <p className="text-sm text-center text-muted-foreground">
                  Enter a brand or model and click search.
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>

      <section className="min-h-[200px]">
        {(isLoading || accessoriesLoading) && hasSearched && (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        )}
        
        {!isLoading && !accessoriesLoading && results && results.length > 0 && hasSearched && (
           <div className="space-y-4">
            <h2 className="font-headline text-2xl font-bold">{results.length} Match(es) Found</h2>
            {results.map((result, i) => (
              <ResultCard 
                key={result.id} 
                result={{...result, lastUpdated: formatTimestamp(result.lastUpdated)}} 
                index={i} 
              />
            ))}
          </div>
        )}

        {!isLoading && !accessoriesLoading && hasSearched && (!results || results.length === 0) && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No accessories found for your search. Try another category or a broader search term.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
