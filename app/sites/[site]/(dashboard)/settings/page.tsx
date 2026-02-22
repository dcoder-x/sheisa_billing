import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default async function SettingsPage() {
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
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
              <p className="text-slate-600 mt-2">Manage your account preferences and settings</p>
            </div>

            {/* Profile Settings */}
            <Card className="bg-white border-slate-200 mb-6">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullname" className="text-slate-700 font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="fullname"
                      value={session?.fullName || ''}
                      disabled
                      className="border-slate-200 bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      value={session?.email || ''}
                      disabled
                      className="border-slate-200 bg-slate-50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-slate-700 font-medium">
                    Account Type
                  </Label>
                  <Input
                    id="role"
                    value={session?.role === 'SUPER_ADMIN' ? 'Platform Administrator' : 'Entity User'}
                    disabled
                    className="border-slate-200 bg-slate-50"
                  />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" disabled>
                  Update Profile
                </Button>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="bg-white border-slate-200 mb-6">
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="border-slate-200">
                  Change Password
                </Button>
                <div>
                  <p className="text-sm text-slate-600 mb-3">Two-Factor Authentication</p>
                  <p className="text-sm text-slate-600 mb-4">
                    Add an extra layer of security to your account.
                  </p>
                  <Button variant="outline" className="border-slate-200">
                    Enable 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-700 font-medium">Email Notifications</Label>
                  <p className="text-sm text-slate-600 mb-3">
                    Receive updates about your account and transactions
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <span className="text-sm text-slate-700">Invoice notifications</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <span className="text-sm text-slate-700">Payment reminders</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <span className="text-sm text-slate-700">Weekly reports</span>
                    </label>
                  </div>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </div>
  );
}
