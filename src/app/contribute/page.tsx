import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContributePage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Contribute Data</CardTitle>
          <CardDescription>
            Help the community by adding new compatibility data. Your contribution will be reviewed and you'll earn points!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="accessory-type">Accessory Type</Label>
              <Input id="accessory-type" placeholder="e.g., Tempered Glass, Back Cover" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="models">Compatible Models</Label>
              <Textarea id="models" placeholder="Enter each model on a new line, e.g.
Redmi Note 10
Oppo A74" rows={6} />
               <p className="text-sm text-muted-foreground">
                Enter all compatible models, including the primary one. Each model on a new line.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source (Optional)</Label>
              <Input id="source" placeholder="e.g., link to a product page or your own testing" />
            </div>
            <Button type="submit" className="w-full">Submit for Review</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
