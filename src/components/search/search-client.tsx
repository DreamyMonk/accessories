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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ResultCard } from '@/components/search/result-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  fuzzyAccessorySearch,
  FuzzyAccessorySearchOutput,
} from '@/ai/flows/fuzzy-accessory-search';
import { Card, CardContent } from '../ui/card';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Accessory } from '@/lib/types';
import { format } from 'date-fns';

const searchSchema = z.object({
  searchTerm: z.string(),
});

type SearchFormValues = z.infer<typeof searchSchema>;

export function SearchClient({ categories }: { categories: string[] }) {
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<Accessory[] | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<FuzzyAccessorySearchOutput | null>(
    null
  );
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      searchTerm: '',
    },
    mode: 'onChange',
  });

  const searchTerm = form.watch('searchTerm');

  // Firebase query for accessories
  const accessoriesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'accessories'),
      where('accessoryType', '==', activeCategory)
    );
  }, [firestore, activeCategory]);

  const { data: accessories, loading: accessoriesLoading } =
    useCollection(accessoriesQuery);

  const performSearch = useCallback(
    async (currentSearchTerm: string, accessoriesData: Accessory[] | null) => {
      if (!accessoriesData) {
        setResults(null);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setResults(null);
      setAiSuggestions(null);

      if (currentSearchTerm.length < 2) {
        setResults(accessoriesData);
        setIsLoading(false);
        return;
      }

      // Simulate API call for local filtering feel
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const searchLower = currentSearchTerm.toLowerCase();
      const filteredResults = accessoriesData.filter(
        (acc) =>
          acc.primaryModel.toLowerCase().includes(searchLower) ||
          (acc.brand && acc.brand.toLowerCase().includes(searchLower)) ||
          acc.compatibleModels.some(m => m.toLowerCase().includes(searchLower))
      );
      
      setResults(filteredResults);
      setIsLoading(false);
    },
    [activeCategory]
  );
  
  useEffect(() => {
    setIsLoading(accessoriesLoading);
    if (!accessoriesLoading && accessories) {
      // Set initial results when data loads
      setResults(accessories);
    }
  }, [accessories, accessoriesLoading]);


  const onSubmit = (data: SearchFormValues) => {
    performSearch(data.searchTerm, accessories);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    form.setValue('searchTerm', '');
    setResults(accessories ? accessories.filter(a => a.accessoryType === category) : null);
    setAiSuggestions(null);
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

        <ScrollArea className="w-full whitespace-nowrap rounded-md">
          <div className="flex w-max space-x-2 pb-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? 'default' : 'outline'}
                className="rounded-full transition-all duration-200"
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
                  {isLoading ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <>
                      Check Compatibility <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                <FormDescription className="text-center">
                  Enter a brand or model and click search.
                </FormDescription>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>

      <section className="min-h-[200px]">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        )}
        
        {!isLoading && results && results.length > 0 && (
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

        {!isLoading && (!results || results.length === 0) && (
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
