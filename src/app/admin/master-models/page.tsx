
import { MasterModelManager } from "@/components/admin/master-model-manager";

export default function MasterModelsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Master Models</h1>
        <p className="text-muted-foreground">
          Manage the master list of models that can be used in your application.
        </p>
      </div>
      <MasterModelManager />
    </div>
  );
}
