'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useFirestore, useUser, useCollection } from "@/firebase";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { AppLayout } from "@/components/layout/app-layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

const contributionSchema = z.object({
  primaryModel: z.string().min(3, "Please enter a primary model name."),
  brand: z.string().min(2, "Please enter a brand name."),
  accessoryType: z.string().min(1, "Please select an accessory type."),
  compatibleModels: z.string().min(3, "Please list at least one model."),
  source: z.string().url().optional().or(z.literal('')),
});

type ContributionFormValues = z.infer<typeof contributionSchema>;

export default function ContributePage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const categoriesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'categories'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: categories, loading: categoriesLoading } = useCollection(categoriesQuery);

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      primaryModel: "",
      brand: "",
      accessoryType: "",
      compatibleModels: "",
      source: "",
    },
  });

  const onSubmit = async (data: ContributionFormValues) => {
    if (!firestore || !user) {
      toast({
        title: "Error",
        description: "You must be logged in to contribute.",
        variant: "destructive",
      });
      return;
    }
    
    const contributionData = {
      ...data,
      compatibleModels: data.compatibleModels.split('\n').map(m => m.trim()).filter(Boolean),
      status: "pending",
      submittedAt: serverTimestamp(),
      submittedBy: user.uid,
    };

    const contributionsCollectionRef = collection(firestore, "contributions");
    addDoc(contributionsCollectionRef, contributionData)
    .then(() => {
        toast({
          title: "Submission Received!",
          description: "Thank you for your contribution. It will be reviewed shortly.",
        });
        form.reset();
        router.push('/my-contributions');
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

  const renderContent = () => {
    if (userLoading || categoriesLoading) {
      return (
        <div className="container mx-auto px-4 py-6 flex justify-center items-center">
          <LoaderCircle className="animate-spin h-8 w-8" />
        </div>
      );
    }
  
    if (!user) {
       return (
        <div className="container mx-auto px-4 py-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Contribute Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">You need to be signed in to contribute.</p>
              <Button asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Contribute Data</CardTitle>
            <CardDescription>
              Help the community by adding new compatibility data. Your contribution will be reviewed and you'll earn points!
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                            <SelectValue placeholder="Select an accessory category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
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
                          placeholder="Enter each model on a new line, e.g.
Redmi Note 10
Oppo A74"
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                       <p className="text-sm text-muted-foreground">
                        Enter all compatible models, including the primary one. Each model on a new line.
                      </p>
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
                        <Input placeholder="e.g., link to a product page or your own testing" {...field} />
                      </FormControl>
                       <p className="text-sm text-muted-foreground">
                        Please provide a link to the product page if available.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Submitting..." : "Submit for Review"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AppLayout>
      {renderContent()}
    </AppLayout>
  )
}
