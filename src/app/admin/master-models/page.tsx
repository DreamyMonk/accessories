
import { MasterModelManager } from "@/components/admin/master-model-manager";
import { promises as fs } from 'fs';
import path from 'path';

async function getMasterModels() {
  const filePath = path.join(process.cwd(), 'src', 'data', 'master-models.json');
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    // If the file doesn't exist or is empty, return an empty array
    return [];
  }
}

export default async function MasterModelsPage() {
  const masterModels = await getMasterModels();

  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-headline font-bold">Master Models</h1>
        <p className="text-muted-foreground">
          Manage the master list of models that can be used in your application.
        </p>
      </div>
      <MasterModelManager initialModels={masterModels} />
    </div>
  );
}
