'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, LoaderCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export function SubmissionsManager({ initialSubmissions }: { initialSubmissions: any[] }) {
  const firestore = useFirestore();
  const [submissions, setSubmissions] = useState<any[]>(initialSubmissions);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const handleStatusUpdate = async (submissionId: string, status: 'approved' | 'rejected') => {
    if (!firestore) return;
    setIsProcessing(submissionId);
    try {
      const ref = doc(firestore, 'contributions', submissionId);
      await updateDoc(ref, {
        status,
        reviewedAt: serverTimestamp()
      });

      setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, status } : s));

      toast({
        title: `Submission ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        description: status === 'approved' ? "Contribution accepted." : "Contribution rejected."
      });

    } catch (error) {
      console.error("Error updating submission:", error);
      toast({ title: "Error", description: "Failed to update submission status.", variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Submissions</CardTitle>
        <CardDescription>Approve or reject pending model submissions.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 w-full rounded-md border">
          <div className="p-4">
            {pendingSubmissions.length > 0 ? (
              <ul className="space-y-2">
                {pendingSubmissions.map(submission => (
                  <li key={submission.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                    <div>
                      <p className="font-semibold text-lg">{submission.accessoryType}</p>
                      <p className="text-sm font-medium">Models: {Array.isArray(submission.models) ? submission.models.join(', ') : submission.models}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted: {submission.submittedAt?.toDate ? new Date(submission.submittedAt.toDate()).toLocaleDateString() : 'Unknown'}
                      </p>
                      {submission.source && (
                        <a href={submission.source} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline block mt-1 truncate max-w-[300px]">
                          {submission.source}
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleStatusUpdate(submission.id, 'approved')}
                        disabled={!!isProcessing}
                        className="hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/20"
                      >
                        {isProcessing === submission.id ? <LoaderCircle className="animate-spin h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleStatusUpdate(submission.id, 'rejected')}
                        disabled={!!isProcessing}
                        className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
                      >
                        {isProcessing === submission.id ? <LoaderCircle className="animate-spin h-4 w-4" /> : <X className="h-4 w-4" />}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Check className="h-12 w-12 mb-4 opacity-20" />
                <p>No pending submissions.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
