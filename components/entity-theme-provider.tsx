'use client';

import { useEffect } from 'react';

interface EntityThemeProviderProps {
  themeColor: string | null;
  children: React.ReactNode;
}

export function EntityThemeProvider({ themeColor, children }: EntityThemeProviderProps) {
  useEffect(() => {
    if (themeColor) {
      const root = document.documentElement;
      
      // Convert hex to HSL for Tailwind variable compatibility if needed, 
      // but for now, we'll assume we can set primary color directly if we use CSS variables correctly.
      // However, shadcn/ui uses HSL values (e.g., 222.2 47.4% 11.2%).
      // We need to convert the hex color to HSL.
      
      const hexToHsl = (hex: string) => {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
          r = parseInt('0x' + hex[1] + hex[1]);
          g = parseInt('0x' + hex[2] + hex[2]);
          b = parseInt('0x' + hex[3] + hex[3]);
        } else if (hex.length === 7) {
          r = parseInt('0x' + hex[1] + hex[2]);
          g = parseInt('0x' + hex[3] + hex[4]);
          b = parseInt('0x' + hex[5] + hex[6]);
        }
        
        r /= 255;
        g /= 255;
        b /= 255;
        
        const cmin = Math.min(r,g,b),
              cmax = Math.max(r,g,b),
              delta = cmax - cmin;
        let h = 0, s = 0, l = 0;

        if (delta === 0) h = 0;
        else if (cmax === r) h = ((g - b) / delta) % 6;
        else if (cmax === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;

        h = Math.round(h * 60);
        if (h < 0) h += 360;

        l = (cmax + cmin) / 2;
        s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
        
        s = +(s * 100).toFixed(1);
        l = +(l * 100).toFixed(1);

        return `${h} ${s}% ${l}%`;
      };

      try {
          const hsl = hexToHsl(themeColor);
          root.style.setProperty('--primary', hsl);
          root.style.setProperty('--ring', hsl);
          // Optionally adjust other derived colors here
      } catch (e) {
          console.error('Invalid theme color:', themeColor);
      }
    }
  }, [themeColor]);

  return <>{children}</>;
}
