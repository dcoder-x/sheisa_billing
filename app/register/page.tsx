'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUploader } from '@/components/ui/file-uploader';
import { LanguageSelector } from '@/components/language-selector';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    entityName: '',
    registrationNumber: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    businessType: '',
    subdomain: '',
    themeColor: '#2563eb', // Default blue
    logoUrl: '',
    password: '',
    confirmPassword: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      let finalLogoUrl = formData.logoUrl;

      // New: Upload logo if a file is selected
      if (logoFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', logoFile);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
           throw new Error('Failed to upload logo');
        }

        const uploadData = await uploadRes.json();
        finalLogoUrl = uploadData.url;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityName: formData.entityName,
          registrationNumber: formData.registrationNumber,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
          businessType: formData.businessType,
          subdomain: formData.subdomain,
          themeColor: formData.themeColor,
          logoUrl: finalLogoUrl, // Use the uploaded URL
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Registration failed');
        return;
      }

      router.push('/register/pending');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4 relative">
      {/* Global Language Selector Overlay */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      
      <Card className="w-full max-w-2xl shadow-lg mt-12 md:mt-0">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Register Your Entity</CardTitle>
          <CardDescription className="text-center">
            Fill in your details to request access to SHIESA Billing Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Entity Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Entity Name *
                </label>
                <Input
                  name="entityName"
                  value={formData.entityName}
                  onChange={handleChange}
                  placeholder="Your organization name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Registration Number *
                </label>
                <Input
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  placeholder="Business registration number"
                  required
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email *
                </label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@entity.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone *
                </label>
                <Input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
            </div>

            {/* Address Information */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Address *
              </label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  City *
                </label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  State *
                </label>
                <Input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Postal Code *
                </label>
                <Input
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="12345"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Country *
                </label>
                <Input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Country"
                  required
                />
              </div>
            </div>

            {/* Branding & Customization */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-lg font-medium text-slate-900">Customization</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Subdomain *
                  </label>
                  <div className="flex">
                    <Input
                      name="subdomain"
                      value={formData.subdomain}
                      onChange={handleChange}
                      placeholder="my-company"
                      required
                      className="rounded-r-none border-r-0"
                    />
                    <div className="bg-slate-100 border border-l-0 border-slate-200 rounded-r-md px-3 flex items-center text-slate-500 text-sm">
                      .sheisa.com
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Your custom login URL</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Theme Color
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      name="themeColor"
                      value={formData.themeColor}
                      onChange={handleChange}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      name="themeColor"
                      value={formData.themeColor}
                      onChange={handleChange}
                      placeholder="#000000"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">
                     Logo
                   </label>
                   <FileUploader 
                      value={formData.logoUrl}
                      onChange={(url) => {
                        setFormData(prev => ({ ...prev, logoUrl: url }));
                        if (!url) setLogoFile(null);
                      }}
                      onFileSelect={(file) => {
                        setLogoFile(file);
                        setFormData(prev => ({ ...prev, logoUrl: URL.createObjectURL(file) }));
                      }}
                   />
                   <p className="text-xs text-slate-500 mt-1">Upload your brand logo for invoices and portal</p>
                </div>
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Business Type *
              </label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select business type</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Retail">Retail</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Services">Services</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password *
                </label>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <Input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Submitting...' : 'Submit Registration Request'}
            </Button>

            {/* Sign In Link */}
            <p className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
