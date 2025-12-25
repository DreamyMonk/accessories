'use client';

import { SearchClient } from "@/components/search/search-client";

export default function CompatibilityPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-headline font-bold">Compatibility Mode</h1>
                <p className="text-muted-foreground">
                    Search chains, edit model names, or delete models from compatibility groups.
                </p>
            </div>
            <SearchClient isAdmin={true} />
        </div>
    )
}
