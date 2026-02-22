'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Session } from '@/lib/auth';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Building2,
  BarChart3,
  ShieldAlert,
  StickyNote,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SidebarProps {
  session: Session | null;
  className?: string; // Allow passing classNames
  entity?: {
    name: string;
    logoUrl: string | null;
    themeColor: string | null;
    subdomain: string | null;
  } | null;
}

interface SidebarContentProps extends SidebarProps {
  onNavigate?: () => void;
}

export function SidebarContent({ session, className, onNavigate, entity }: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isSuperAdmin = session?.role === 'SUPER_ADMIN';
  const isEntityAdmin = session?.role === 'ENTITY_ADMIN';

  const tenantNavItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/invoices', label: 'Invoices', icon: FileText },
    { href: '/invoices/templates', label: 'Templates', icon: StickyNote },
  ];

  if (isEntityAdmin) {
    tenantNavItems.push(
      { href: '/suppliers', label: 'Suppliers', icon: Users },
      { href: '/reports', label: 'Reports', icon: BarChart3 },
      { href: '/users', label: 'Users', icon: Users },
      { href: '/settings', label: 'Settings', icon: Settings }
    );
  }

  const navItems = isSuperAdmin
    ? [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/entities', label: 'Entities', icon: Building2 },
        { href: '/admin/requests', label: 'Requests', icon: ShieldAlert },
        { href: '/admin/compliance', label: 'Compliance', icon: ShieldAlert },
        { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      ]
    : tenantNavItems;

  const brandName = entity?.name || 'SHIESA';
  const brandLogo = entity?.logoUrl;

  return (
    <div className={cn("flex flex-col h-full bg-slate-50 border-r border-slate-200", className)}>
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <Link 
          href={isSuperAdmin ? '/admin' : '/'} 
          className="flex items-center gap-3"
          onClick={onNavigate}
        >
          {brandLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brandLogo} alt={brandName} className="h-10 w-auto object-contain" />
          ) : (
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <span className="font-bold">{brandName.substring(0, 1)}</span>
            </div>
          )}
          <div>
            <p className="font-bold text-slate-900">{brandName}</p>
            <p className="text-xs text-slate-500">{isSuperAdmin ? 'Admin' : 'Billing'}</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-slate-700 hover:bg-slate-100'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-slate-200 p-4 space-y-2">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
            pathname === '/settings'
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-slate-700 hover:bg-slate-100'
          )}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>

        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" />
          <span>{isLoading ? 'Signing out...' : 'Logout'}</span>
        </button>
      </div>

      {/* User Info */}
      <div className="border-t border-slate-200 p-4">
        <div className="bg-primary/5 rounded-lg p-3">
          <p className="text-xs text-slate-600">Logged in as</p>
          <p className="text-sm font-medium text-slate-900 truncate">{session?.email}</p>
          <p className="text-xs text-slate-500 capitalize">
            {session?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Entity User'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ session, entity }: SidebarProps) {
  return (
    <aside className="hidden md:flex md:w-64 h-screen sticky top-0">
      <SidebarContent session={session} entity={entity} className="w-full" />
    </aside>
  );
}
