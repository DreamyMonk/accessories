"use client";

import { useState, useEffect } from 'react';
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ResultCard } from "@/components/search/result-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { fuzzyAccessorySearch, FuzzyAccessorySearchOutput } from '@/ai/flows/fuzzy-accessory-search';
import { Card, CardContent } from '../ui/card';

interface SearchClientProps {
  categories: string[];
}

const mockResults = [
  {
    id: 'group-1',
    primaryModel: 'Redmi Note 10',
    accessoryType: 'Tempered Glass',
    compatibleModels: ['Redmi Note 10', 'Redmi Note 10S', 'Oppo A74', 'Redmi Note 10 Lite', 'Poco M2 Pro', 'Redmi Note 9 Pro Max'],
    brand: 'Redmi',
    contributor: {
      name: 'Rahul',
      points: 12,
    },
    lastUpdated: '2025-11-26',
    source: 'Admin',
  },
];

const searchSchema = z.object({
  searchTerm: z.string().min(2, "Search term must be at least 2 characters."),
});

type SearchFormValues = z.infer<typeof searchSchema>;

export function SearchClient({ categories }: SearchClientProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<FuzzyAccessorySearchOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      searchTerm: "",
    },
    mode: "onChange",
  });

  const searchTerm = form.watch("searchTerm");

  const performSearch = async (searchTermValue: string) => {
    if (searchTermValue.length < 2) {
      setResults(null);
      setAiSuggestions(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setResults(null);
    setAiSuggestions(null);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const exactMatchFound = searchTermValue.toLowerCase().includes('note 10');

    if (exactMatchFound) {
      setResults(mockResults);
    } else {
      try {
        const aiResponse = await fuzzyAccessorySearch({ searchTerm: `${searchTermValue} ${activeCategory}` });
        setAiSuggestions(aiResponse);
        if (aiResponse.suggestedMatches.length === 0 && aiResponse.alternativeSearchTerms.length === 0) {
            if (aiResponse.recommendFollowUp) {
                toast({
                    title: "No suggestions found",
                    description: "Try asking a follow-up question or rephrasing your search.",
                });
            } else {
                 toast({
                    title: "No results",
                    description: "We couldn't find any matches. Try a different search.",
                });
            }
        }
      } catch (error) {
        console.error("AI search failed:", error);
        toast({
          title: "Search Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'searchTerm') {
        setIsLoading(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);


  useEffect(() => {
    const debouncedSearch = setTimeout(() => {
      performSearch(searchTerm);
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(debouncedSearch);
    };
  }, [searchTerm, activeCategory]);

  const onSubmit = (data: SearchFormValues) => {
    performSearch(data.searchTerm);
  };

  return (
    <div className="space-y-8">
      <section id="search" className="scroll-mt-20">
        <div className="text-center mb-8">
          <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">Accessory Compatibility Finder</h1>
          <p className="text-muted-foreground mt-2">Instantly find compatible accessories for any phone model.</p>
        </div>

        <ScrollArea className="w-full whitespace-nowrap rounded-md">
          <div className="flex w-max space-x-2 pb-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                className="rounded-full transition-all duration-200"
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <Card className="mt-4 shadow-lg" style={{boxShadow: '0 6px 18px rgba(11, 132, 255, 0.08)'}}>
          <CardContent className="p-4 md:p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="searchTerm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Search by Brand, Model, etc.</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Samsung Galaxy S23 Ultra Case" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full text-lg py-6" disabled={isLoading && !searchTerm}>
                  {isLoading ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <>
                      Check Compatibility <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                <FormDescription className="text-center">
                  Enter a brand, model, and/or accessory. Results will appear as you type.
                </FormDescription>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>

      <section className="min-h-[200px]">
        {isLoading && searchTerm.length >= 2 && (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        )}

        {!isLoading && results && (
          <div className="space-y-4">
            <h2 className="font-headline text-2xl font-bold">Exact Match Found</h2>
            {results.map((result, i) => (
              <ResultCard key={result.id} result={result} index={i} />
            ))}
          </div>
        )}

        {!isLoading && aiSuggestions && (aiSuggestions.suggestedMatches.length > 0 || aiSuggestions.alternativeSearchTerms.length > 0) && (
          <div className="space-y-4">
            <h2 className="font-headline text-2xl font-bold">No Exact Match Found</h2>
            <p className="text-muted-foreground">We couldn't find an exact match. Here are some AI-powered suggestions:</p>

            {aiSuggestions.suggestedMatches.length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">Suggested Matches</h3>
                        <ul className="list-disc list-inside space-y-1">
                            {aiSuggestions.suggestedMatches.map(item => <li key={item} className="text-muted-foreground">{item}</li>)}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {aiSuggestions.alternativeSearchTerms.length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">Alternative Search Terms</h3>
                        <div className="flex flex-wrap gap-2">
                            {aiSuggestions.alternativeSearchTerms.map(term => (
                                <Button key={term} variant="outline" size="sm" onClick={() => {
                                    form.setValue('searchTerm', term, { shouldValidate: true });
                                }}>{term}</Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
