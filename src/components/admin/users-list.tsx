'use client';

import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
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
import { Shield, ShieldCheck } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useMemo } from 'react';

export function UsersList() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('displayName', 'asc'));
  }, [firestore]);

  const { data: users, loading } = useCollection(usersQuery);

  const toggleAdmin = async (userId: string, currentRole: string) => {
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

  if (loading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Points</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <TableRow key={user.id}>
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
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>{user.points || 0}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAdmin(user.id, user.role)}
                >
                  {user.role === 'admin' ? (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Demote to User
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Promote to Admin
                    </>
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
