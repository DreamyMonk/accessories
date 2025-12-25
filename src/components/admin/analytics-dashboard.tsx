'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function AnalyticsDashboard() {
  const firestore = useFirestore();

  // Fetch last 1000 logs
  const logsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'search_logs'),
      orderBy('timestamp', 'desc'),
      limit(1000)
    );
  }, [firestore]);

  const { data: logs, loading } = useCollection(logsQuery);

  const stats = useMemo(() => {
    if (!logs) return { today: 0, yesterday: 0, last7: 0, last30: 0, topModels: [] };

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let todayCount = 0;
    let yesterdayCount = 0;
    let last7Count = 0;
    let last30Count = 0;
    const modelCounts: Record<string, number> = {};

    logs.forEach((log: any) => {
      // Handle timestamp (Firestore Timestamp vs Date)
      const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.date || log.timestamp);
      if (!date || isNaN(date.getTime())) return;

      const dateStr = date.toISOString().split('T')[0];

      if (dateStr === todayStr) todayCount++;
      if (dateStr === yesterdayStr) yesterdayCount++;
      if (date >= sevenDaysAgo) last7Count++;
      if (date >= thirtyDaysAgo) last30Count++;

      // Top Models (normalize)
      const term = log.term?.trim();
      if (term) {
        const normalized = term.toUpperCase(); // Case insensitive
        modelCounts[normalized] = (modelCounts[normalized] || 0) + 1;
      }
    });

    // Sort Top Models
    const sortedModels = Object.entries(modelCounts)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    return {
      today: todayCount,
      yesterday: yesterdayCount,
      last7: last7Count,
      last30: last30Count,
      topModels: sortedModels
    };
  }, [logs]);

  const handleExport = () => {
    if (!logs) return;
    
    const headers = ['Date', 'Time', 'Term', 'Category'];
    const csvContent = [
      headers.join(','),
      ...logs.map((log: any) => {
         const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.date);
         return [
           date.toLocaleDateString(),
           date.toLocaleTimeString(),
           `"${log.term?.replace(/"/g, '""')}"`, // Escape quotes
           log.category || 'Unknown'
         ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `search_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Searches (Today)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">
              {stats.yesterday > 0 ? (
                 stats.today > stats.yesterday 
                 ? `+${Math.round(((stats.today - stats.yesterday)/stats.yesterday)*100)}% from yesterday`
                 : `${Math.round(((stats.today - stats.yesterday)/stats.yesterday)*100)}% from yesterday`
              ) : "No data from yesterday"}
            </p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Yesterday</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.yesterday}</div>
            </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.last7}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 30 Days</CardTitle>
             <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.last30}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Searched Models</CardTitle>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Model Name</TableHead>
                        <TableHead className="text-right">Searches</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stats.topModels.length > 0 ? (
                        stats.topModels.map((item, i) => (
                            <TableRow key={i}>
                                <TableCell className="font-medium">{item.term}</TableCell>
                                <TableCell className="text-right">{item.count}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground">No data yet</TableCell>
                        </TableRow>
                    )}
                </TableBody>
             </Table>
          </CardContent>
        </Card>
         
         <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Term</TableHead>
                            <TableHead>Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(logs || []).slice(0, 8).map((log:any, i:number) => {
                             const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.date);
                             return (
                                <TableRow key={log.id || i}>
                                    <TableCell>{log.term}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </TableCell>
                                </TableRow>
                             )
                        })}
                        {(!logs || logs.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">No recent searches</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                 </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
