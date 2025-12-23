'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, LoaderCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { approveSubmission, rejectSubmission } from '@/app/admin/submissions/actions';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Submission {
    id: string;
    modelName: string;
    accessoryType: string;
    createdAt: string;
}

export function SubmissionsManager({ initialSubmissions }: { initialSubmissions: Submission[] }) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const handleApprove = async (submissionId: string) => {
    setIsProcessing(submissionId);
    const result = await approveSubmission(submissionId);
    if (result.success) {
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
      toast({ title: "Submission Approved", description: "The model has been added to the master list." });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsProcessing(null);
  };

  const handleReject = async (submissionId: string) => {
    setIsProcessing(submissionId);
    const result = await rejectSubmission(submissionId);
    if (result.success) {
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
      toast({ title: "Submission Rejected", description: "The submission has been removed." });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsProcessing(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Submissions</CardTitle>
        <CardDescription>Approve or reject pending model submissions.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 w-full rounded-md border">
            <div className="p-4">
                {submissions.length > 0 ? (
                    <ul className="space-y-2">
                    {submissions.map(submission => (
                        <li key={submission.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                            <div>
                                <p className="font-semibold">{submission.modelName}</p>
                                <p className="text-sm text-muted-foreground">Type: {submission.accessoryType} - Submitted: {new Date(submission.createdAt).toLocaleDateString()}</p>
                            </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleApprove(submission.id)}
                                disabled={!!isProcessing}
                            >
                                {isProcessing === submission.id ? <LoaderCircle className="animate-spin h-4 w-4" /> : <Check className="text-green-500 h-4 w-4" />}
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleReject(submission.id)}
                                disabled={!!isProcessing}
                            >
                                 {isProcessing === submission.id ? <LoaderCircle className="animate-spin h-4 w-4" /> : <X className="text-destructive h-4 w-4" />}
                            </Button>
                        </div>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-sm text-center text-muted-foreground p-4">No pending submissions.</p>
                )}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
