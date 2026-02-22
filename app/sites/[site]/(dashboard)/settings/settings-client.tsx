'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Session } from '@/lib/auth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SettingsClientProps {
  session: Session;
  entity: {
    id: string;
    name: string;
    logoUrl: string | null;
    themeColor: string | null;
  } | null;
}

export function SettingsClient({ session, entity }: SettingsClientProps) {
  const router = useRouter();
  
  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Entity Branding State
  const [themeColor, setThemeColor] = useState(entity?.themeColor || '#2563eb');
  const [isUpdatingBranding, setIsUpdatingBranding] = useState(false);

  const isEntityAdmin = session.role === 'ENTITY_ADMIN';

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to change password');
      }

      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleBrandingUpdate = async () => {
    if (!isEntityAdmin) return;
    
    setIsUpdatingBranding(true);
    try {
      const res = await fetch(`/api/entities/${entity?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeColor }),
      });

      if (!res.ok) throw new Error('Failed to update branding');
      toast.success('Brand color updated successfully');
      router.refresh();
    } catch (error) {
      toast.error('Failed to update brand color');
    } finally {
      setIsUpdatingBranding(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error('File size must be less than 4MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const loaderId = toast.loading('Uploading logo...');
    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Failed to upload image');
      const { url } = await uploadRes.json();

      const updateRes = await fetch(`/api/entities/${entity?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: url }),
      });

      if (!updateRes.ok) throw new Error('Failed to update entity with new logo');

      toast.success('Logo updated successfully!', { id: loaderId });
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Upload failed', { id: loaderId });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-2">Manage your account preferences and settings</p>
      </div>

      {/* Profile Settings */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullname" className="text-slate-700 font-medium">Full Name</Label>
              <Input id="fullname" value={session.fullName} disabled className="border-slate-200 bg-slate-50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
              <Input id="email" value={session.email} disabled className="border-slate-200 bg-slate-50" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role" className="text-slate-700 font-medium">Account Type</Label>
            <Input id="role" value={isEntityAdmin ? 'Administrator' : 'Regular User'} disabled className="border-slate-200 bg-slate-50" />
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Change your password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input 
                id="currentPassword" 
                type="password" 
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)} 
                required 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                  id="newPassword" 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  minLength={8} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <Button type="submit" disabled={isChangingPassword} className="bg-slate-900 border text-white">
              {isChangingPassword ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Updating...</> : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Entity Branding (Admins Only) */}
      {isEntityAdmin && entity && (
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle>Workspace Branding</CardTitle>
            <CardDescription>Customize the logo and colors for your entity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Company Logo</Label>
              {entity.logoUrl && (
                <div className="mb-4">
                  <img src={entity.logoUrl} alt="Logo" className="h-16 w-auto object-contain border rounded-md p-2 bg-slate-50" />
                </div>
              )}
              <div className="flex items-center gap-4">
                <Button variant="outline" className="relative overflow-hidden cursor-pointer" type="button">
                  Upload New Logo
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    accept="image/png, image/jpeg, image/gif"
                    onChange={handleLogoUpload}
                  />
                </Button>
              </div>
              <p className="text-xs text-slate-500">Supported formats: PNG, JPG, GIF up to 4MB.</p>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="themeColor">Theme Color (Hex)</Label>
              <div className="flex items-center gap-4">
                <div className="relative w-10 h-10 rounded-md overflow-hidden border border-slate-200 shrink-0">
                  <input
                    type="color"
                    id="colorPicker"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                  />
                </div>
                <Input
                  id="themeColor"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  placeholder="#000000"
                  className="font-mono"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t py-4">
            <Button onClick={handleBrandingUpdate} disabled={isUpdatingBranding} className="ml-auto bg-blue-600 text-white hover:bg-blue-700">
              {isUpdatingBranding ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Saving...</> : 'Save Branding'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
