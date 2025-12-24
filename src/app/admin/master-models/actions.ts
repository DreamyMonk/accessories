'use server';

// This file is deprecated as Master Models have moved to Firestore.
// Keeping this file empty or with minimal placeholder to avoid breaking builds if imported elsewhere until refactored.
// All logic is now client-side in src/components/admin/master-model-manager.tsx using Firestore.

export async function addMasterModel(modelName: string) {
  throw new Error("Deprecated");
}
export async function deleteMasterModel(modelName: string) {
  throw new Error("Deprecated");
}
export async function addMasterModelsFromCsv(csvContent: string) {
  throw new Error("Deprecated");
}
