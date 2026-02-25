import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { LanguageSelector } from '@/components/language-selector';

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      
      <Card className="w-full max-w-md shadow-lg text-center mt-12 md:mt-0">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Registration Submitted</CardTitle>
          <CardDescription className="mt-2">
            Your registration request has been submitted successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-slate-800 mb-2">What happens next?</h3>
            <ul className="text-sm text-slate-700 space-y-2">
              <li className="flex items-start">
                <span className="mr-3">1.</span>
                <span>Our team will review your registration request</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">2.</span>
                <span>You will receive an email notification once approved</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">3.</span>
                <span>Sign in with your credentials to start using the platform</span>
              </li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Typical approval time:</strong> 24-48 hours
            </p>
          </div>

          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">
              Back to Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
