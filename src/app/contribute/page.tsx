import { AppLayout } from '@/components/layout/app-layout';
import { ContributionFlow } from '@/components/contribute/contribution-flow';
import { promises as fs } from 'fs';
import path from 'path';

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

export default async function ContributePage() {
  const masterModels = await getMasterModels();

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-headline mb-4">Contribute to the Database</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Help other shop owners by adding compatible models. You earn points for every approved contribution!
          </p>
        </div>
        <ContributionFlow masterModels={masterModels} />
      </div>
    </AppLayout>
  );
}
