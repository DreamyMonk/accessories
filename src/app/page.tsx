import { AppLayout } from '@/components/layout/app-layout';
import { SearchClient } from '@/components/search/search-client';
import { promises as fs } from 'fs';
import path from 'path';
import { ContributeDialog } from '@/components/contribute-dialog';

async function getMasterModels() {
  const filePath = path.join(process.cwd(), 'src', 'data', 'master-models.json');
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Error reading master models:", error);
    return [];
  }
}

export default async function Home() {
  const masterModels = await getMasterModels();

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <SearchClient masterModels={masterModels} />
      </div>
    </AppLayout>
  );
}
