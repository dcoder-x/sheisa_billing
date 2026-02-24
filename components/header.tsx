"use client"
import { useState, useEffect } from 'react';
import { Session } from '@/lib/auth';
import { Bell, Search, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'; // Added SheetTitle import
import { SidebarContent } from '@/components/sidebar';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';


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
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('auto_translate_lang');
    if (saved) setCurrentLang(saved);
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const lang = e.target.value;
      setCurrentLang(lang);
      localStorage.setItem('auto_translate_lang', lang);
      
      if (lang === 'en') {
          // Clear translation back to defaults
          document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      } else {
          // Force Google Translate via cookie
          document.cookie = `googtrans=/en/${lang}; path=/`;
          document.cookie = `googtrans=/en/${lang}; path=/; domain=${window.location.hostname}`;
      }
      
      window.location.reload();
  };

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
        <div className="flex items-center gap-4 ml-auto">
          
          {/* Custom Language Selector */}
          <select 
            value={currentLang}
            onChange={handleLanguageChange}
            className="hidden md:block bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="pt">Português</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="it">Italiano</option>
            <option value="nl">Nederlands</option>
            <option value="ru">Русский</option>
            <option value="zh-CN">中文</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
            <option value="hi">हिन्दी</option>
            <option value="ar">العربية</option>
          </select>

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
