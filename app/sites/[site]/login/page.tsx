import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { LoginForm } from './login-form';

export default async function TenantLoginPage({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  const subdomain = site;

  const entity = await prisma.entity.findUnique({
    where: { subdomain },
  });

  if (!entity) {
    notFound();
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left Side - Branding */}
      <div 
        className="hidden md:flex flex-col justify-between p-12 bg-primary text-primary-foreground relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/10 z-0" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            {entity.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={entity.logoUrl} alt={entity.name} className="h-10 w-auto" />
            ) : (
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <span className="text-xl font-bold">{entity.name.substring(0, 1)}</span>
              </div>
            )}
            <span className="text-2xl font-bold tracking-tight">{entity.name}</span>
          </div>
          
          <div className="mt-24">
             <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Welcome to the {entity.name} Portal
            </h1>
            <p className="text-lg opacity-90 max-w-md">
              Securely access your billing dashboard, manage invoices, and track payments.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-sm opacity-70">
          © {new Date().getFullYear()} {entity.name}. Powered by SHIESA.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex items-center justify-center p-8 bg-slate-50">
        <LoginForm subdomain={subdomain} />
      </div>
    </div>
  );
}
