import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';

const reports = [
  {
    id: 1,
    name: 'Monthly Financial Report',
    type: 'Financial',
    date: 'Dec 31, 2024',
    status: 'Ready',
  },
  {
    id: 2,
    name: 'Q4 Compliance Report',
    type: 'Compliance',
    date: 'Dec 20, 2024',
    status: 'Ready',
  },
  {
    id: 3,
    name: 'Vendor Performance Summary',
    type: 'Vendor',
    date: 'Dec 15, 2024',
    status: 'Ready',
  },
];

export default async function ReportsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role === 'SUPER_ADMIN') {
    redirect('/admin');
  }

  if (session.role === 'ENTITY_USER') {
    redirect('/');
  }

  return (
          <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
                <p className="text-slate-600 mt-2">View and download your reports</p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Generate Report</Button>
            </div>

            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="bg-white border-slate-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{report.name}</p>
                          <p className="text-sm text-slate-600">
                            {report.type} Report • {report.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          {report.status}
                        </span>
                        <Button variant="outline" size="sm" className="border-slate-200">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
  );
}
