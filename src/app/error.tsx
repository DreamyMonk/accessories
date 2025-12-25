'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Application Error:", error);
    }, [error]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-6 p-4 text-center">
            <div className="flex bg-destructive/10 p-4 rounded-full">
                <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
                <p className="text-muted-foreground max-w-[500px]">
                    We encountered an unexpected error. This might be due to a temporary glitch or corrupted data.
                </p>
                {error.message && (
                    <p className="text-xs font-mono bg-muted p-2 rounded text-destructive">{error.message}</p>
                )}
            </div>
            <div className="flex gap-4">
                <Button onClick={() => reset()}>Try again</Button>
                <Button variant="outline" onClick={() => window.location.href = '/admin/debug'}>
                    Go to Debug & Cleanup
                </Button>
            </div>
        </div>
    );
}
