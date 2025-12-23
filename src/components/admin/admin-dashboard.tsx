'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubmissionsManager } from './submissions-manager';
import { MasterModelManager } from './master-model-manager';
import { AddNewForm } from './add-new-form';
import { BulkAddModelsForm } from './bulk-add-models-form';
import { ManageGroups } from './manage-groups';

export function AdminDashboard({ masterModels, submissions, models }: { masterModels: string[], submissions: any[], models: any[] }) {
  return (
    <Tabs defaultValue="submissions">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="submissions">Submissions</TabsTrigger>
        <TabsTrigger value="master-models">Master Models</TabsTrigger>
        <TabsTrigger value="add-new">Add New</TabsTrigger>
        <TabsTrigger value="manage-groups">Manage Groups</TabsTrigger>
      </TabsList>
      <TabsContent value="submissions">
        <SubmissionsManager initialSubmissions={submissions} />
      </TabsContent>
      <TabsContent value="master-models">
         <MasterModelManager initialModels={masterModels} />
      </TabsContent>
      <TabsContent value="add-new">
        <div className="space-y-6">
          <AddNewForm masterModels={masterModels} />
          <BulkAddModelsForm />
        </div>
      </TabsContent>
      <TabsContent value="manage-groups">
        <ManageGroups accessories={models} />
      </TabsContent>
    </Tabs>
  );
}
