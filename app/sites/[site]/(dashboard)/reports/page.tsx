import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { GenerateReportButton } from './generate-report-button';

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

  const reports = await prisma.report.findMany({
    where: { entityId: session.entityId },
    orderBy: { createdAt: 'desc' }
  });

  return (
          <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
                <p className="text-slate-600 mt-2">View and download your reports</p>
              </div>
              <GenerateReportButton />
            </div>

            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="text-center py-12 text-slate-500 border border-dashed border-slate-300 rounded-lg">No reports generated yet.</div>
              ) : (
                reports.map((report) => (
                  <Card key={report.id} className="bg-white border-slate-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{report.reportType} Report</p>
                            <p className="text-sm text-slate-600">
                              {new Date(report.generatedDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                            Ready
                          </span>
                          <a href={report.filePath} target="_blank" download>
                            <Button variant="outline" size="sm" className="border-slate-200">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
  );
}
