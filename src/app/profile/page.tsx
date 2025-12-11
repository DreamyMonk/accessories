import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="font-headline">Profile</CardTitle>
          <CardDescription>This is a placeholder page for user profiles.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>User authentication and profile management can be built out here.</p>
          <Button className="mt-4 w-full">Sign In / Sign Up</Button>
        </CardContent>
      </Card>
    </div>
  );
}
