
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersList } from "@/components/admin/users-list";

export default function UsersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">User Management</h1>
        <p className="text-muted-foreground">
          View users and manage their roles.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            A list of all users in the system. Use the actions to manage their roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersList />
        </CardContent>
      </Card>
    </div>
  );
}
