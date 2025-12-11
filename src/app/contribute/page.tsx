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
import { useFirestore } from "@/firebase";

const contributionSchema = z.object({
  accessoryType: z.string().min(3, "Accessory type must be at least 3 characters."),
  compatibleModels: z.string().min(3, "Please list at least one model."),
  source: z.string().url().optional().or(z.literal('')),
});

type ContributionFormValues = z.infer<typeof contributionSchema>;

export default function ContributePage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      accessoryType: "",
      compatibleModels: "",
      source: "",
    },
  });

  const onSubmit = async (data: ContributionFormValues) => {
    if (!firestore) {
      toast({
        title: "Error",
        description: "Firestore is not available. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addDoc(collection(firestore, "contributions"), {
        ...data,
        compatibleModels: data.compatibleModels.split('\n').map(m => m.trim()).filter(Boolean),
        status: "pending",
        submittedAt: serverTimestamp(),
      });

      toast({
        title: "Submission Received!",
        description: "Thank you for your contribution. It will be reviewed shortly.",
      });
      form.reset();
    } catch (error) {
      console.error("Error submitting contribution:", error);
      toast({
        title: "Submission Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

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
