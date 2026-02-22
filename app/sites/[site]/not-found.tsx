
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TenantNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🏢</span>
          </div>
          <CardTitle className="text-xl">Organization Not Found</CardTitle>
          <CardDescription>
            The organization you are looking for does not exist or may have been deactivated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-500">
            Please check the URL and try again. If you believe this is an error, contact support.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild variant="default" className="w-full">
               <Link href="/">Go to Main Site</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Sign In to Another Account</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
