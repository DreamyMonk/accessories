'use client';

import { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { AccessoryGroupCard } from "./accessory-group-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function ManageGroups({ accessories }: { accessories: any[] }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAccessories = useMemo(() => {
        if (!searchTerm) return accessories;

        return accessories.filter(acc => 
            acc.models.some((model: any) => {
                const modelName = typeof model === 'string' ? model : model.name;
                return modelName.toLowerCase().includes(searchTerm.toLowerCase());
            })
        );
    }, [accessories, searchTerm]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl">Manage Accessory Groups</CardTitle>
                <CardDescription>
                    Here you can view, search, and manage all accessory groups and their compatible models.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-6">
                    <Input 
                        placeholder="Search by model name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                </div>

                <div className="space-y-4">
                    {filteredAccessories.length > 0 ? (
                        filteredAccessories.map(acc => (
                            <AccessoryGroupCard key={acc.id} accessory={acc} />
                        ))
                    ) : (
                        <p>No groups found matching your search.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
