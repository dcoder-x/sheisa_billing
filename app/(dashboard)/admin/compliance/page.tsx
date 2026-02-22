import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, Search } from 'lucide-react';

const complianceData = [
  {
    id: 1,
    entity: 'Tech Solutions Inc',
    status: 'Compliant',
    statusIcon: 'check',
    lastAudit: 'Dec 15, 2024',
    nextAudit: 'Mar 15, 2025',
    score: '98%',
  },
  {
    id: 2,
    entity: 'Global Services Ltd',
    status: 'Compliant',
    statusIcon: 'check',
    lastAudit: 'Dec 10, 2024',
    nextAudit: 'Mar 10, 2025',
    score: '95%',
  },
  {
    id: 3,
    entity: 'Premier Trading Co',
    status: 'Non-Compliant',
    statusIcon: 'alert',
    lastAudit: 'Dec 1, 2024',
    nextAudit: 'Jan 15, 2025',
    score: '72%',
  },
];

export default async function CompliancePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  return (
          <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Compliance Monitoring</h1>
              <p className="text-slate-600 mt-2">Monitor entity compliance status and audit reports</p>
            </div>

            {/* Compliance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-white border-slate-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600 mb-2">Compliant Entities</p>
                  <p className="text-3xl font-bold text-green-600">145</p>
                  <p className="text-xs text-slate-600 mt-2">Out of 150 entities</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600 mb-2">Non-Compliant</p>
                  <p className="text-3xl font-bold text-red-600">5</p>
                  <p className="text-xs text-slate-600 mt-2">Requiring attention</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600 mb-2">Compliance Score</p>
                  <p className="text-3xl font-bold text-blue-600">96.7%</p>
                  <p className="text-xs text-slate-600 mt-2">Platform average</p>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Details */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle>Entity Compliance Status</CardTitle>
                <CardDescription>Detailed compliance information for each entity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search entities..."
                      className="pl-10 border-slate-200 bg-slate-50"
                    />
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Entity</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Last Audit</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Next Audit</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Score</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {complianceData.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-900 font-medium">{item.entity}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {item.statusIcon === 'check' ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                )}
                                <span
                                  className={`font-medium ${
                                    item.statusIcon === 'check'
                                      ? 'text-green-700'
                                      : 'text-red-700'
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{item.lastAudit}</td>
                            <td className="py-3 px-4 text-slate-600">{item.nextAudit}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  parseInt(item.score) >= 95
                                    ? 'bg-green-100 text-green-700'
                                    : parseInt(item.score) >= 80
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {item.score}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <Button variant="outline" size="sm" className="border-slate-200">
                                View Report
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
  );
}
