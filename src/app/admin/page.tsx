import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CsvUploadForm } from "@/components/admin/csv-upload-form";

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <AdminDashboard />

      <Card>
        <CardHeader>
          <CardTitle>Bulk Upload Accessories</CardTitle>
          <CardDescription>
            Upload a CSV file to add multiple accessories at once. The CSV should have the following columns in this exact order: `primaryModel`, `accessoryType`, `compatibleModels`, `brand`, and `source`. The `compatibleModels` should be a comma-separated list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CsvUploadForm />
        </CardContent>
      </Card>
    </div>
  );
}
