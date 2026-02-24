'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Maps country codes to Google Translate language codes
const countryLanguageMap: Record<string, string> = {
  // English speaking
  'US': 'en', 'GB': 'en', 'AU': 'en', 'CA': 'en', 'NZ': 'en',
  
  // Spanish speaking
  'ES': 'es', 'MX': 'es', 'CO': 'es', 'AR': 'es', 'PE': 'es', 'VE': 'es', 'CL': 'es', 'EC': 'es', 'GT': 'es', 'CU': 'es', 'BO': 'es', 'DO': 'es', 'HN': 'es', 'PY': 'es', 'SV': 'es', 'NI': 'es', 'CR': 'es', 'PA': 'es', 'UY': 'es', 'GQ': 'es',
  
  // Portuguese speaking
  'PT': 'pt', 'BR': 'pt', 'AO': 'pt', 'MZ': 'pt', 'GW': 'pt', 'TL': 'pt', 'CV': 'pt', 'ST': 'pt',
  
  // French speaking
  'FR': 'fr', 'CD': 'fr', 'MG': 'fr', 'CM': 'fr', 'CI': 'fr', 'BF': 'fr', 'NE': 'fr', 'SN': 'fr', 'ML': 'fr', 'RW': 'fr', 'BE': 'fr', 'HT': 'fr', 'TD': 'fr', 'GN': 'fr', 'BI': 'fr', 'BJ': 'fr', 'CH': 'fr', 'TG': 'fr', 'CF': 'fr', 'CG': 'fr', 'GA': 'fr',
  
  // Others
  'DE': 'de', 'IT': 'it', 'NL': 'nl', 'RU': 'ru', 'CN': 'zh-CN', 'JP': 'ja', 'KR': 'ko', 'IN': 'hi', 'SA': 'ar', 'ZA': 'en', 'NG': 'en', 'KE': 'sw'
};

export function AutoTranslator() {
  const [isInit, setIsInit] = useState(false);
  const pathname = usePathname();

  // Handle Next.js soft navigation (client-side routing)
  useEffect(() => {
     const savedLang = localStorage.getItem('auto_translate_lang');
     if (savedLang && savedLang !== 'en') {
       // Wait for React to finish hydrating the new page's DOM elements
       const timer = setTimeout(() => {
          const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
          if (combo) {
             combo.value = savedLang;
             combo.dispatchEvent(new Event('change', { bubbles: true }));
          }
       }, 300);
       return () => clearTimeout(timer);
     }
  }, [pathname]);

  useEffect(() => {
    if (isInit) return;
    setIsInit(true);

    const initializeTranslateScript = () => {
        document.body.classList.add('hide-google-translate-banner');

        if (!document.getElementById('google-translate-script')) {
            const addScript = document.createElement('script');
            addScript.id = 'google-translate-script';
            addScript.setAttribute('src', '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit');
            document.body.appendChild(addScript);

            (window as any).googleTranslateElementInit = () => {
              new (window as any).google.translate.TranslateElement({
                pageLanguage: 'en',
                layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false,
              }, 'google_translate_element');
            };
        }
    };

    const savedLang = localStorage.getItem('auto_translate_lang');
    if (savedLang) {
        initializeTranslateScript();
        return;
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=3&accept-language=en`);
            
            if (res.ok) {
                const data = await res.json();
                const countryCode = data?.address?.country_code?.toUpperCase();
                
                if (countryCode && countryLanguageMap[countryCode]) {
                    const lang = countryLanguageMap[countryCode];
                    localStorage.setItem('auto_translate_lang', lang);
                    
                    if (lang !== 'en') {
                        document.cookie = `googtrans=/en/${lang}; path=/`;
                        document.cookie = `googtrans=/en/${lang}; path=/; domain=${window.location.hostname}`;
                        window.location.reload();
                        return;
                    }
                }
            }
          } catch (error) {
            console.error('Failed to reverse geocode', error);
          }
          localStorage.setItem('auto_translate_lang', 'en');
          initializeTranslateScript();
        },
        (error) => {
          console.warn('Geolocation denied or failed, falling back to browser language', error);
          const browserLang = navigator.language.split('-')[0];
          localStorage.setItem('auto_translate_lang', browserLang);
          if (browserLang !== 'en') {
              document.cookie = `googtrans=/en/${browserLang}; path=/`;
              document.cookie = `googtrans=/en/${browserLang}; path=/; domain=${window.location.hostname}`;
              window.location.reload();
              return;
          }
          initializeTranslateScript();
        }
      );
    } else {
        localStorage.setItem('auto_translate_lang', 'en');
        initializeTranslateScript();
    }
  }, [isInit]);

  return (
      <div id="google_translate_element" className="hidden"></div>
  );
}
