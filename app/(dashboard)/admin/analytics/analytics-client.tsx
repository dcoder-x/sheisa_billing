'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const revenueData = [
  { month: 'Jan', revenue: 120000 },
  { month: 'Feb', revenue: 145000 },
  { month: 'Mar', revenue: 165000 },
  { month: 'Apr', revenue: 155000 },
  { month: 'May', revenue: 185000 },
  { month: 'Jun', revenue: 210000 },
];

const invoiceData = [
  { status: 'Paid', count: 2847 },
  { status: 'Pending', count: 834 },
  { status: 'Overdue', count: 156 },
  { status: 'Cancelled', count: 10 },
];

export function AnalyticsClient() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Platform Analytics</h1>
        <p className="text-slate-600 mt-2">Monitor platform performance and metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-2">Total Invoices</p>
            <p className="text-3xl font-bold text-slate-900">3,847</p>
            <p className="text-xs text-green-600 mt-2">↑ 12% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-2">Avg Invoice Value</p>
            <p className="text-3xl font-bold text-slate-900">$4,521</p>
            <p className="text-xs text-green-600 mt-2">↑ 8% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-2">Collection Rate</p>
            <p className="text-3xl font-bold text-slate-900">87%</p>
            <p className="text-xs text-green-600 mt-2">↑ 3% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-2">Avg Days Overdue</p>
            <p className="text-3xl font-bold text-slate-900">12</p>
            <p className="text-xs text-red-600 mt-2">↑ 2 days from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Trend */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Status Distribution */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
            <CardDescription>Current distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={invoiceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="status" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entity Performance */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle>Top Performing Entities</CardTitle>
          <CardDescription>By monthly revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Tech Solutions Inc', revenue: '$245,000', percentage: 95 },
              { name: 'Global Services Ltd', revenue: '$189,500', percentage: 73 },
              { name: 'Premier Trading Co', revenue: '$156,750', percentage: 60 },
            ].map((entity, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-slate-900">{entity.name}</p>
                  <p className="text-sm font-semibold text-slate-900">{entity.revenue}</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${entity.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
