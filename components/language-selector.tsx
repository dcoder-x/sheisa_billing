"use client"
import { useState, useEffect } from 'react';

export function LanguageSelector({ className }: { className?: string }) {
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
          document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      } else {
          document.cookie = `googtrans=/en/${lang}; path=/`;
          document.cookie = `googtrans=/en/${lang}; path=/; domain=${window.location.hostname}`;
      }
      
      window.location.reload();
  };

  return (
    <select 
      value={currentLang}
      onChange={handleLanguageChange}
      className={`bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary cursor-pointer ${className || ''}`}
    >
      <option value="en">EN</option>
      <option value="es">ES</option>
      <option value="pt">PT</option>
      <option value="fr">FR</option>
      <option value="de">DE</option>
      <option value="it">IT</option>
      <option value="nl">NL</option>
      <option value="ru">RU</option>
      <option value="zh-CN">ZH</option>
      <option value="ja">JA</option>
      <option value="ko">KO</option>
      <option value="hi">HI</option>
      <option value="ar">AR</option>
    </select>
  );
}
