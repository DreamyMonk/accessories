'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, LogOut, Settings, Award, Shield, User } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import Link from 'next/link';

export default function SettingsPage() {
    const { user, loading } = useUser();
    const { signOut } = useAuth();

    if (loading) return (
        <AppLayout>
            <div className="flex h-screen items-center justify-center">Loading...</div>
        </AppLayout>
    );

    if (!user) return (
        <AppLayout>
            <div className="container mx-auto px-4 py-8 text-center space-y-4">
                <h1 className="text-2xl font-bold">Sign In Required</h1>
                <p>Please sign in to view your settings.</p>
                <Link href="/login">
                    <Button>Sign In</Button>
                </Link>
            </div>
        </AppLayout>
    );

    const displayName = user.displayName || 'User';
    const email = user.email || 'No email';
    const photoURL = user.photoURL || '';
    const initials = displayName.substring(0, 2).toUpperCase();

    // Placeholder for contributions count or points (requires fetching user profile from Firestore if stored separately)
    // For now, assuming user object might have extended data or we just show static/placeholder
    const points = (user as any).points || 0; // If you have custom claims or extended user object

    // Check if admin (simple check derived from email or claims if available, otherwise just show User)
    const isAdmin = email.endsWith('@admin.com') || (user as any).role === 'admin';

    return (
        <AppLayout>
            <div className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
                <div className="flex items-center gap-4 mb-4">
                    <Settings className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold font-headline">Account Settings</h1>
                </div>

                {/* Profile Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Manage your public profile and account details.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                        <Avatar className="h-24 w-24 border-2 border-primary/10">
                            <AvatarImage src={photoURL} />
                            <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-4 flex-1 text-center md:text-left">
                            <div>
                                <h2 className="text-2xl font-bold">{displayName}</h2>
                                <p className="text-muted-foreground">{email}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                {isAdmin ? (
                                    <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
                                        <Shield className="h-3 w-3 mr-1" /> Admin
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">
                                        <User className="h-3 w-3 mr-1" /> Contributor
                                    </Badge>
                                )}
                                <Badge variant="outline" className="border-orange-500/50 text-orange-600">
                                    <Award className="h-3 w-3 mr-1" /> {points} Points
                                </Badge>
                            </div>
                        </div>
                        <div>
                            <Button variant="outline" onClick={() => signOut()}>
                                <LogOut className="h-4 w-4 mr-2" /> Sign Out
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Actions */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Link href="/my-contributions" className="block h-full">
                        <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Link2 className="h-5 w-5" />
                                    My Contributions
                                </CardTitle>
                                <CardDescription>
                                    View status of models and chains you have submitted for approval.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="link" className="px-0">View History &rarr;</Button>
                            </CardContent>
                        </Card>
                    </Link>

                    {isAdmin && (
                        <Link href="/admin" className="block h-full">
                            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer bg-slate-900 text-white border-none">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <Shield className="h-5 w-5" />
                                        Admin Dashboard
                                    </CardTitle>
                                    <CardDescription className="text-slate-300">
                                        Manage accessories, review submissions, and system settings.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="secondary" className="w-full">Open Dashboard</Button>
                                </CardContent>
                            </Card>
                        </Link>
                    )}
                </div>

                {/* Danger Zone (Visual only for now) */}
                <Card className="border-destructive/20">
                    <CardHeader>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center">
                        <div>
                            <p className="font-medium">Delete Account</p>
                            <p className="text-sm text-muted-foreground">Permanently remove your account and all personal data.</p>
                        </div>
                        <Button variant="destructive" disabled>Delete Account</Button>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
