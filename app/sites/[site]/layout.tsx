import { EntityThemeProvider } from '@/components/entity-theme-provider';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ site: string }>;
}) {
  const { site } = await params;
  const subdomain = site;

  console.log(`[TenantLayout] Lookup for subdomain: ${subdomain}`);

  const entity = await prisma.entity.findUnique({
    where: { subdomain },
  });
  
  if (entity) {
      console.log(`[TenantLayout] Entity found: ${entity.name}`);
  } else {
      console.log(`[TenantLayout] Entity NOT found for: ${subdomain}`);
  }

  if (!entity) {
    notFound();
  }

  // Check if entity is active
  if (entity.status !== 'ACTIVE') {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
              <div className="max-w-md w-full px-6 py-8 bg-white shadow-md rounded-lg text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Not Active</h1>
                  <p className="text-gray-600 mb-6">
                      This organization's account is currently {entity.status.toLowerCase()}.
                      Please contact support for assistance.
                  </p>
              </div>
          </div>
      );
  }

  return (
    <EntityThemeProvider themeColor={entity.themeColor}>
      {children}
    </EntityThemeProvider>
  );
}
