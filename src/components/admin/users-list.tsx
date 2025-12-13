'use client';

import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, ShieldCheck, MoreHorizontal, Trash2, Ban, CircleUserRound } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useMemo, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function UsersList() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const { toast } = useToast();
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('displayName', 'asc'));
  }, [firestore]);

  const { data: users, loading } = useCollection(usersQuery);

  const handleUpdateRole = async (userId: string, currentRole: string) => {
    if (!firestore) return;

    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const userDocRef = doc(firestore, 'users', userId);

    updateDoc(userDocRef, { role: newRole })
      .then(() => {
        toast({
          title: 'Role Updated',
          description: `User has been set to ${newRole}.`,
        });
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: { role: newRole },
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
          title: 'Update Failed',
          description: 'Could not update user role. Check permissions.',
          variant: 'destructive',
        });
      });
  };

  const handleToggleSuspend = async (userId: string, isSuspended: boolean) => {
    if (!firestore) return;

    const newSuspensionStatus = !isSuspended;
    const userDocRef = doc(firestore, 'users', userId);

    updateDoc(userDocRef, { isSuspended: newSuspensionStatus })
      .then(() => {
        toast({
          title: 'User Updated',
          description: `User has been ${newSuspensionStatus ? 'suspended' : 'unsuspended'}.`,
        });
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: { isSuspended: newSuspensionStatus },
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
          title: 'Update Failed',
          description: 'Could not update user suspension status. Check permissions.',
          variant: 'destructive',
        });
      });
  }

  const handleDeleteUser = async (userId: string) => {
    if (!firestore) return;

    const userDocRef = doc(firestore, 'users', userId);
    
    deleteDoc(userDocRef)
      .then(() => {
        toast({
          title: 'User Deleted',
          description: 'The user\'s data has been removed from Firestore.',
        });
      })
      .catch((error) => {
         const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
          title: 'Delete Failed',
          description: 'Could not delete user data. Check permissions.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsAlertOpen(false);
        setUserToDelete(null);
      })
  }
  
  if (loading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    );
  }

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Points</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id} className={user.isSuspended ? 'bg-muted/50' : ''}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.photoURL} />
                      <AvatarFallback>
                        {user.displayName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.displayName}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                    <div className="flex flex-wrap gap-1">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                        </Badge>
                        {user.isSuspended && <Badge variant="destructive">Suspended</Badge>}
                    </div>
                </TableCell>
                <TableCell>{user.points || 0}</TableCell>
                <TableCell className="text-right">
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={user.id === adminUser?.uid}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleUpdateRole(user.id, user.role)}>
                        {user.role === 'admin' ? <><CircleUserRound className="mr-2 h-4 w-4" />Demote to User</> : <><ShieldCheck className="mr-2 h-4 w-4" />Promote to Admin</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleSuspend(user.id, user.isSuspended)}>
                         {user.isSuspended ? <><Ban className="mr-2 h-4 w-4" />Unsuspend</> : <><Ban className="mr-2 h-4 w-4" />Suspend</>}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => {
                            setUserToDelete(user);
                            setIsAlertOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user data for <span className="font-semibold">{userToDelete?.displayName}</span>. This action cannot be undone. Note: This only deletes the user's data, not their authentication record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => userToDelete && handleDeleteUser(userToDelete.id)}
            >
              Yes, delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
