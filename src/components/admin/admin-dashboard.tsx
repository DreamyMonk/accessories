'use client';

import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubmissionsManager } from './submissions-manager';
import { MasterModelManager } from './master-model-manager';
import { AddNewForm } from './add-new-form';
import { BulkAddModelsForm } from './bulk-add-models-form';
import { CategoryManager } from './category-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Archive, CheckCircle, Clock, Database, FileText, LayoutGrid, Plus, Smartphone, Users, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminDashboard({ masterModels, submissions, models }: { masterModels: string[], submissions: any[], models: any[] }) {

  const stats = {
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    totalsub: submissions.length,
    accessories: models.length,
    masterModels: masterModels.length
  };

  const [activeTab, setActiveTab] = useState("overview");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-5 p-1 bg-muted/50 rounded-xl">
        <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Overview</TabsTrigger>
        <TabsTrigger value="submissions" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Submissions</TabsTrigger>
        <TabsTrigger value="master-models" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Master Models</TabsTrigger>
        <TabsTrigger value="add-new" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Add Data</TabsTrigger>
        <TabsTrigger value="categories" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Categories</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {/* Hero Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Submissions waiting action</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Approvals</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">Lifetime contributions accepted</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accessory Groups</CardTitle>
              <Archive className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.accessories}</div>
              <p className="text-xs text-muted-foreground">Active accessory categories</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Master Models</CardTitle>
              <Smartphone className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.masterModels}</div>
              <p className="text-xs text-muted-foreground">Unique devices in database</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card className="col-span-4 shadow-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks you perform often.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 grid-cols-2 lg:grid-cols-3">
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2 hover:bg-muted/50 border-dashed border-2"
                onClick={() => setActiveTab("submissions")}
              >
                <FileText className="h-6 w-6" />
                Review Submissions
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2 hover:bg-muted/50 border-dashed border-2"
                onClick={() => setActiveTab("add-new")}
              >
                <Plus className="h-6 w-6" />
                Add New Accessory
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2 hover:bg-muted/50 border-dashed border-2"
                onClick={() => setActiveTab("categories")}
              >
                <Tag className="h-6 w-6" />
                Manage Categories
              </Button>
            </CardContent>
          </Card>
          <Card className="col-span-2 shadow-sm bg-gradient-to-br from-primary/5 to-background border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Database Status</span>
                  <span className="font-medium text-green-600 flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Online</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total Submissions</span>
                  <span className="font-medium">{stats.totalsub}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Admin Access</span>
                  <span className="font-medium">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="submissions" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Review Submissions</h2>
          <p className="text-muted-foreground">
            {stats.pending} pending items requiring your attention.
          </p>
        </div>
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

      <TabsContent value="categories">
        <CategoryManager />
      </TabsContent>

    </Tabs>
  );
}
