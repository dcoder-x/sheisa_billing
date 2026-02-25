'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Loader2, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { InvoicesTable } from './invoices-table';

interface KPICard {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export function EntityDashboard() {
  const [kpiData, setKpiData] = useState<KPICard[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/analytics/entity');
        if (res.ok) {
          const data = await res.json();
          setKpiData(data.kpi || []);
          setChartData(data.chartData || []);
        }
      } catch (error) {
        console.error('Failed to fetch analytics', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor your billing and generate new invoices.</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Link href="/invoices/generate">
            <FileUp className="w-4 h-4" />
            Bulk Generate Invoices
          </Link>
        </Button>
      </div>

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
                      <span className="text-xs text-slate-600">vs last month</span>
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
        {/* Expenses/Sales Analytics */}
        <Card className="lg:col-span-2 bg-white border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Expenses Analytics</CardTitle>
                <CardDescription>Weekly performance</CardDescription>
              </div>
              <button className="text-sm text-primary hover:text-primary/80 font-medium">
                Last 7 Days
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="sales" name="Expenses" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Summary Card - Simplified or Removed if data not available */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Quick Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">Pending Invoices</p>
              <p className="text-xl font-bold text-slate-900">
                {kpiData.find(k => k.title === 'Pending Invoices')?.value || '$0'}
              </p>
            </div>
            <div className="h-px bg-slate-200"></div>
            <div>
              <p className="text-sm text-slate-600">Total Suppliers</p>
              <p className="text-xl font-bold text-slate-900">
                {kpiData.find(k => k.title === 'Total Suppliers')?.value || '0'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 gap-6">
        <div>
          <InvoicesTable />
        </div>
      </div>
    </div>
  );
}
