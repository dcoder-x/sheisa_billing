"use client"
import { useState } from 'react';
import { Session } from '@/lib/auth';
import { Bell, Search, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'; // Added SheetTitle import
import { SidebarContent } from '@/components/sidebar';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { LanguageSelector } from '@/components/language-selector';


interface HeaderProps {
  session: Session | null;
  title?: string;
  entity?: {
    name: string;
    logoUrl: string | null;
    themeColor: string | null;
    subdomain: string | null;
  } | null;
}

export function Header({ session, title, entity }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const initials = session?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-[9]">
      <div className="flex items-center justify-between px-4 md:px-8 py-4">
        
        {/* Mobile Menu Trigger */}
        <div className="md:hidden mr-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6 text-slate-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <VisuallyHidden.Root>
                 <SheetTitle>Navigation Menu</SheetTitle>
              </VisuallyHidden.Root>
              <SidebarContent 
                session={session} 
                entity={entity}
                onNavigate={() => setIsMobileMenuOpen(false)} 
                className="border-none"
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* Left: Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search something here..."
              className="pl-10 border-slate-200 bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Right: Language, Notifications and Profile */}
        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          
          {/* Custom Language Selector */}
          <LanguageSelector />

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          <Avatar className="w-10 h-10 bg-primary text-primary-foreground">
            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
