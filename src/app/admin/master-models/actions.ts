'use server';

import { promises as fs } from 'fs';
import path from 'path';
import Papa from 'papaparse';

const modelsFilePath = path.join(process.cwd(), 'src', 'data', 'master-models.json');

export async function getMasterModels(): Promise<string[]> {
  try {
    const fileContent = await fs.readFile(modelsFilePath, 'utf-8');
    if (!fileContent) {
      return [];
    }
    return JSON.parse(fileContent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    console.error("Error reading master models:", error);
    throw new Error("Could not read master models file.");
  }
}

// Keep internal usage consistent if needed, or just replace all calls.
const readMasterModels = getMasterModels;

async function writeMasterModels(models: string[]): Promise<void> {
  try {
    await fs.writeFile(modelsFilePath, JSON.stringify(models, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing master models:", error);
    throw new Error("Could not write to master models file.");
  }
}

export async function addMasterModel(modelName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const models = await readMasterModels();

    if (models.includes(modelName)) {
      return { success: false, error: "Model already exists." };
    }

    const newModels = [...models, modelName].sort();
    await writeMasterModels(newModels);

    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}

export async function deleteMasterModel(modelName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const models = await readMasterModels();

    if (!models.includes(modelName)) {
      return { success: false, error: "Model not found." };
    }

    const newModels = models.filter(m => m !== modelName);
    await writeMasterModels(newModels);

    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}

export async function addMasterModelsFromCsv(csvContent: string): Promise<{ success: boolean; error?: string; addedCount?: number }> {
  try {
    const existingModels = await readMasterModels();

    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase()
    });

    // Only fail if we genuinely have no data and effectively failed completely
    if (parseResult.data.length === 0 && parseResult.errors.length > 0) {
      console.error("CSV Parse Errors:", parseResult.errors);
      return { success: false, error: 'Failed to parse CSV file. Ensure it has a "model" header.' };
    }

    const newModels = parseResult.data
      .map((row: any) => {
        // Try common column names
        return row.model?.trim() || row['master model']?.trim() || row.name?.trim() || row.value?.trim();
      })
      .filter((model: string | undefined) => model && model.length > 0 && !existingModels.includes(model));

    // Deduplicate within the new batch
    const uniqueNewModels = Array.from(new Set(newModels));

    if (uniqueNewModels.length === 0) {
      return { success: true, addedCount: 0 };
    }

    const updatedModels = [...existingModels, ...uniqueNewModels].sort();
    await writeMasterModels(updatedModels);

    return { success: true, addedCount: uniqueNewModels.length };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}
