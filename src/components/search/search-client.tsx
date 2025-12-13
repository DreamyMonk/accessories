'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ArrowRight, LoaderCircle, Search as SearchIcon, Wand2 } from 'lucide-react';
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
import { fuzzyAccessorySearch, FuzzyAccessorySearchOutput } from '@/ai/flows/fuzzy-accessory-search';
import { cn } from '@/lib/utils';

const searchSchema = z.object({
  searchTerm: z.string(),
});

type SearchFormValues = z.infer<typeof searchSchema>;

export function SearchClient() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Accessory[] | null>(null);
  const [searchedTerm, setSearchedTerm] = useState<string>('');
  const [aiSuggestions, setAiSuggestions] = useState<FuzzyAccessorySearchOutput | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionBoxOpen, setIsSuggestionBoxOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const firestore = useFirestore();
  const searchCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      searchTerm: '',
    },
    mode: 'onChange',
  });

  const searchTerm = form.watch('searchTerm');

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
      setSearchedTerm(currentSearchTerm);
      setAiSuggestions(null);
      setIsSuggestionBoxOpen(false);

      try {
        // A small delay to make the loading feel less jarring
        await new Promise((resolve) => setTimeout(resolve, 300));

        if (currentSearchTerm.length < 1) {
          setResults(null);
          setHasSearched(false);
          return;
        }

        const searchLower = currentSearchTerm.toLowerCase();
        const filteredResults = accessories.filter(
          (acc) =>
            acc.accessoryType === activeCategory &&
            acc.models &&
            acc.models.some((m) => m.toLowerCase().includes(searchLower))
        );

        if (filteredResults.length > 0) {
          setResults(filteredResults);
        } else {
          // If no results, call the AI fuzzy search
          const suggestions = await fuzzyAccessorySearch({
            searchTerm: currentSearchTerm,
          });
          setAiSuggestions(suggestions);
        }
      } catch (error) {
        console.error("Error during search:", error);
        // Optionally, set an error state to show in the UI
      } finally {
        setIsLoading(false);
      }
    },
    [accessories, activeCategory]
  );
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchCardRef.current && !searchCardRef.current.contains(event.target as Node)) {
        setIsSuggestionBoxOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchTerm && searchTerm.length > 1 && accessories && activeCategory) {
        const searchLower = searchTerm.toLowerCase();
        const uniqueSuggestions = new Set<string>();

        accessories
          .filter(acc => acc.accessoryType === activeCategory)
          .forEach(acc => {
            if (acc.models && Array.isArray(acc.models)) {
              acc.models.forEach(model => {
                if (model.toLowerCase().includes(searchLower)) {
                    uniqueSuggestions.add(model);
                }
              });
            }
            if(acc.brand && acc.brand.toLowerCase().includes(searchLower)){
                uniqueSuggestions.add(acc.brand);
            }
        });
        setSuggestions(Array.from(uniqueSuggestions).slice(0, 10)); // Limit to 10 suggestions
        setIsSuggestionBoxOpen(uniqueSuggestions.size > 0);
    } else {
        setSuggestions([]);
        setIsSuggestionBoxOpen(false);
    }
  }, [searchTerm, accessories, activeCategory]);


  const onSubmit = (data: SearchFormValues) => {
    performSearch(data.searchTerm);
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    form.setValue('searchTerm', suggestion);
    performSearch(suggestion);
  }

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    form.setValue('searchTerm', '');
    setResults(null);
    setAiSuggestions(null);
    setHasSearched(false);
    setSuggestions([]);
    setIsSuggestionBoxOpen(false);
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return format(timestamp.toDate(), 'yyyy-MM-dd');
    }
    return 'N/A';
  }
  
  const renderCategories = () => {
    if (!isMounted || categoriesLoading) {
      return (
        <div className="flex justify-center w-full space-x-2 pb-4">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      );
    }

    return (
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
    );
  }

  const renderResults = () => {
    if (!isMounted) return null;

    if ((isLoading || (accessoriesLoading && hasSearched))) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      );
    }

    if (!isLoading && results && results.length > 0 && hasSearched) {
      return (
         <div className="space-y-4">
          <h2 className="font-headline text-2xl font-bold">{results.length} Result(s) Found</h2>
          {results.map((result, i) => (
            <ResultCard 
              key={result.id} 
              result={{...result, lastUpdated: formatTimestamp(result.lastUpdated)}}
              searchedModel={searchedTerm}
              index={i} 
            />
          ))}
        </div>
      );
    }
     
    if (!isLoading && hasSearched && (!results || results.length === 0)) {
       return (
        <>
        {aiSuggestions ? (
           <Card>
              <CardContent className="p-6">
                 <div className="flex items-center gap-2 mb-4">
                    <Wand2 className="h-6 w-6 text-primary" />
                    <h3 className="font-headline text-xl font-semibold">No exact matches found. How about these?</h3>
                 </div>
                {aiSuggestions.suggestedMatches.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Suggested Matches:</h4>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions.suggestedMatches.map((suggestion, i) => (
                        <Button key={i} variant="outline" onClick={() => form.setValue('searchTerm', suggestion)}>{suggestion}</Button>
                      ))}
                    </div>
                  </div>
                )}
                {aiSuggestions.alternativeSearchTerms.length > 0 && (
                   <div>
                    <h4 className="font-semibold mb-2">Alternative Searches:</h4>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions.alternativeSearchTerms.map((term, i) => (
                         <Button key={i} variant="outline" onClick={() => form.setValue('searchTerm', term)}>{term}</Button>
                      ))}
                    </div>
                  </div>
                )}
                {aiSuggestions.recommendFollowUp && (
                   <p className="mt-4 text-sm text-muted-foreground">Try asking a follow-up question for more help.</p>
                )}
              </CardContent>
           </Card>
        ) : (
           <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No accessories found for your search. Try another category or a broader search term.</p>
            </CardContent>
          </Card>
        )}
        </>
      );
    }

    return null;
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

        {renderCategories()}
        
        <Card
          ref={searchCardRef}
          className="mt-4 shadow-lg relative"
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
                          disabled={!activeCategory || !isMounted}
                           onFocus={() => {
                            if(suggestions.length > 0) setIsSuggestionBoxOpen(true)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <Button type="submit" className="w-full text-lg py-6" disabled={isLoading || !activeCategory || !isMounted}>
                  {isLoading ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <>
                      Check Compatibility <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                 <p className="text-sm text-center text-muted-foreground">
                  Enter a brand or model to see auto-suggestions.
                </p>
              </form>
            </Form>
          </CardContent>
           {isSuggestionBoxOpen && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 border bg-background rounded-b-md shadow-lg">
                <ul>
                    {suggestions.map((suggestion, index) => (
                        <li key={index}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted cursor-pointer"
                            onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <SearchIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{suggestion}</span>
                        </li>
                    ))}
                </ul>
            </div>
           )}
        </Card>
      </section>

      <section className="min-h-[200px]">
        {renderResults()}
      </section>
    </div>
  );
}
