'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, useAuth as useFirebaseAuth } from '@/firebase'; // Renaming useAuth to avoid conflict if needed, or just imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, LogOut, Settings, Award, Shield, User, KeyRound, Trash2, LoaderCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { deleteUser, updatePassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { user, loading } = useUser();
    const auth = useFirebaseAuth();
    const { toast } = useToast();
    const router = useRouter();

    // States
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

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
    const points = (user as any).points || 0;
    const isAdmin = email.endsWith('@admin.com') || (user as any).role === 'admin';

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== "DELETE") return;
        setIsDeleting(true);
        try {
            await deleteUser(user);
            toast({ title: "Account Deleted", description: "Your account has been permanently removed." });
            router.push('/');
        } catch (error: any) {
            console.error("Delete account error", error);
            if (error.code === 'auth/requires-recent-login') {
                toast({
                    title: "Authentication Error",
                    description: "For security, please sign out and sign in again before deleting your account.",
                    variant: "destructive"
                });
            } else {
                toast({ title: "Error", description: "Could not delete account. Try again later.", variant: "destructive" });
            }
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword.length < 6) {
            toast({ title: "Weak Password", description: "Password must be at least 6 characters.", variant: "destructive" });
            return;
        }
        setIsChangingPassword(true);
        try {
            await updatePassword(user, newPassword);
            toast({ title: "Success", description: "Password updated successfully." });
            setPasswordDialogOpen(false);
            setNewPassword("");
        } catch (error: any) {
            console.error("Password update error", error);
            if (error.code === 'auth/requires-recent-login') {
                toast({
                    title: "Authentication Error",
                    description: "Please sign out and sign in again to change your password.",
                    variant: "destructive"
                });
            } else {
                toast({ title: "Error", description: error.message || "Failed to update password.", variant: "destructive" });
            }
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleResetEmail = async () => {
        if (!email) return;
        try {
            await sendPasswordResetEmail(auth, email);
            toast({ title: "Email Sent", description: "Check your inbox for password reset instructions." });
            setPasswordDialogOpen(false);
        } catch (error) {
            toast({ title: "Error", description: "Failed to send reset email.", variant: "destructive" });
        }
    }

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
                        <div className="flex flex-col gap-2 w-full md:w-auto">
                            <Button variant="outline" onClick={() => signOut(auth)}>
                                <LogOut className="h-4 w-4 mr-2" /> Sign Out
                            </Button>

                            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="secondary">
                                        <KeyRound className="h-4 w-4 mr-2" /> Change Password
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Change Password</DialogTitle>
                                        <DialogDescription>
                                            Enter a new password below. You may need to re-login if it has been a while.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>New Password</Label>
                                            <Input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="••••••"
                                            />
                                        </div>
                                        <div className="text-center text-sm text-muted-foreground">
                                            Or, <button onClick={handleResetEmail} className="text-primary hover:underline">send a reset email</button> instead.
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handleChangePassword} disabled={isChangingPassword || !newPassword}>
                                            {isChangingPassword && <LoaderCircle className="animate-spin mr-2 h-4 w-4" />}
                                            Update Password
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
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

                {/* Danger Zone */}
                <Card className="border-destructive/20">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Danger Zone
                        </CardTitle>
                        <CardDescription>
                            Irreversible account actions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <p className="font-medium">Delete Account</p>
                            <p className="text-sm text-muted-foreground">Permanently remove your account and all associated data.</p>
                        </div>

                        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="text-destructive">Delete Account</DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Warning</AlertTitle>
                                        <AlertDescription>
                                            If you have contributed data, it may be kept anonymously.
                                        </AlertDescription>
                                    </Alert>
                                    <div className="space-y-2">
                                        <Label>Type <span className="font-bold">DELETE</span> to confirm</Label>
                                        <Input
                                            value={deleteConfirm}
                                            onChange={(e) => setDeleteConfirm(e.target.value)}
                                            placeholder="DELETE"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDeleteAccount}
                                        disabled={deleteConfirm !== 'DELETE' || isDeleting}
                                    >
                                        {isDeleting && <LoaderCircle className="animate-spin mr-2 h-4 w-4" />}
                                        Confirm Deletion
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
