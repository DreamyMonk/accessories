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
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { AppLayout } from "@/components/layout/app-layout";

const contributionSchema = z.object({
  accessoryType: z.string().min(3, "Accessory type must be at least 3 characters."),
  compatibleModels: z.string().min(3, "Please list at least one model."),
  source: z.string().url().optional().or(z.literal('')),
});

type ContributionFormValues = z.infer<typeof contributionSchema>;

export default function ContributePage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, loading } = useUser();

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
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
    if (loading) {
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
                <FormField
                  control={form.control}
                  name="accessoryType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accessory Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Tempered Glass, Back Cover" {...field} />
                      </FormControl>
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
                       <FormDescription>
                        Please provide a link to the product page if available.
                      </FormDescription>
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
