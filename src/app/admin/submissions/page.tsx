
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CsvUploadForm } from "@/components/admin/csv-upload-form";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Link from "next/link";
import { ManualAddForm } from "@/components/admin/manual-add-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubmissionsList } from "@/components/admin/submissions-list";

export default function SubmissionsPage() {
  const categories = ['Tempered Glass', 'Cases & Covers', 'Batteries', 'Chargers', 'Cables'];
  
  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-headline font-bold">Submissions</h1>
        <p className="text-muted-foreground">
          Review and approve new data contributions from the community.
        </p>
      </div>

       <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
            <SubmissionsList status="pending" />
        </TabsContent>
        <TabsContent value="approved">
            <SubmissionsList status="approved" />
        </TabsContent>
        <TabsContent value="rejected">
            <SubmissionsList status="rejected" />
        </TabsContent>
      </Tabs>


      <Card>
        <CardHeader>
          <CardTitle>Add Accessory Manually</CardTitle>
          <CardDescription>
            Add a single accessory directly to the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManualAddForm categories={categories} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-grow">
              <CardTitle>Bulk Upload Accessories</CardTitle>
              <CardDescription>
                Upload a CSV file to add multiple accessories at once.
              </CardDescription>
            </div>
            <Link href="/dummy-accessories.csv" download passHref legacyBehavior>
              <Button variant="outline" className="mt-4 sm:mt-0">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
           <p className="text-sm text-muted-foreground mb-4">
            The CSV should have the following columns in this exact order: `primaryModel`, `accessoryType`, `compatibleModels`, `brand`, and `source`. The `compatibleModels` should be a semicolon-separated list.
          </p>
          <CsvUploadForm />
        </CardContent>
      </Card>
    </div>
  );
}
