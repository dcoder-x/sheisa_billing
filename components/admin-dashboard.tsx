'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { EntitiesTable } from './entities-table';

const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

interface KPICard {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export function AdminDashboard() {
  const [kpiData, setKpiData] = useState<KPICard[]>([]);
  const [distributionData, setDistributionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/admin')
      .then((res) => res.json())
      .then((data) => {
        if (data.kpi) {
             setKpiData(data.kpi);
             setDistributionData(data.distribution || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">{kpi.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                <div className="flex items-center gap-1">
                  {kpi.change && (
                    <>
                      {kpi.isPositive ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          kpi.isPositive ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {kpi.change}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Entity Distribution */}
        <Card className="bg-white border-slate-200 lg:col-span-1">
          <CardHeader>
            <CardTitle>Entity Distribution</CardTitle>
            <CardDescription>By business type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
                {distributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        >
                        {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        </Pie>
                        <Legend />
                    </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        No distribution data available
                    </div>
                )}
            </div>
          </CardContent>
        </Card>
        
        {/* Placeholder for future Revenue Chart */}
        <Card className="bg-white border-slate-200 lg:col-span-2 flex items-center justify-center">
            <div className="text-center text-slate-400 p-12">
                <p>More analytics coming soon...</p>
            </div>
        </Card>
      </div>

      {/* Entities Table */}
      <EntitiesTable />
    </div>
  );
}
