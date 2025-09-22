'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import CommandPalette from '@/components/ui/CommandPalette';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <CommandPalette />
      {children}
    </ThemeProvider>
  );
}
