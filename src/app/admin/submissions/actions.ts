'use server';

import { promises as fs } from 'fs';
import path from 'path';

interface Submission {
  id: string;
  modelName: string;
  accessoryType: string; // Or a more specific type if you have one
  createdAt: string;
}

const submissionsFilePath = path.join(process.cwd(), 'src', 'data', 'pending-submissions.json');
const masterModelsFilePath = path.join(process.cwd(), 'src', 'data', 'master-models.json');


async function readSubmissions(): Promise<Submission[]> {
  try {
    const fileContent = await fs.readFile(submissionsFilePath, 'utf-8');
    if (!fileContent) return [];
    return JSON.parse(fileContent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    console.error("Error reading submissions:", error);
    throw new Error("Could not read submissions file.");
  }
}

async function writeSubmissions(submissions: Submission[]): Promise<void> {
  try {
    await fs.writeFile(submissionsFilePath, JSON.stringify(submissions, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing submissions:", error);
    throw new Error("Could not write to submissions file.");
  }
}

export async function createSubmission(modelName: string, accessoryType: string): Promise<{ success: boolean; error?: string }> {
  try {
    const submissions = await readSubmissions();
    
    const newSubmission: Submission = {
      id: new Date().toISOString(), // Simple unique ID
      modelName: modelName.trim(),
      accessoryType,
      createdAt: new Date().toISOString(),
    };

    submissions.push(newSubmission);
    await writeSubmissions(submissions);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}

export async function getSubmissions(): Promise<Submission[]> {
    return await readSubmissions();
}

export async function approveSubmission(submissionId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const submissions = await readSubmissions();
        const submission = submissions.find(s => s.id === submissionId);

        if (!submission) {
            return { success: false, error: "Submission not found." };
        }

        // Add to master models list
        const modelsFileContent = await fs.readFile(masterModelsFilePath, 'utf-8');
        const masterModels = modelsFileContent ? JSON.parse(modelsFileContent) : [];
        
        if (!masterModels.includes(submission.modelName)) {
            const newModels = [...masterModels, submission.modelName].sort();
            await fs.writeFile(masterModelsFilePath, JSON.stringify(newModels, null, 2), 'utf-8');
        }

        // Remove from pending submissions
        const newSubmissions = submissions.filter(s => s.id !== submissionId);
        await writeSubmissions(newSubmissions);

        return { success: true };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

export async function rejectSubmission(submissionId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const submissions = await readSubmissions();
        const newSubmissions = submissions.filter(s => s.id !== submissionId);

        if (submissions.length === newSubmissions.length) {
             return { success: false, error: "Submission not found." };
        }

        await writeSubmissions(newSubmissions);
        return { success: true };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}
