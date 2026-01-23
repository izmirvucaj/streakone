import { Colors } from '@/constants/theme';
import { getThemePreference, saveThemePreference } from '@/utils/storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  colors: typeof Colors.light;
  isDark: boolean;
  theme: ThemeMode;
  themePreference: ThemeMode;
  setTheme: (preference: ThemeMode) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemePreference] = useState<ThemeMode>('dark');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      const saved = await getThemePreference();
      // Convert 'system' to 'dark' if exists, only keep light/dark
      if (saved === 'light' || saved === 'dark') {
        setThemePreference(saved);
      } else {
        // If system was saved, default to dark
        setThemePreference('dark');
        await saveThemePreference('dark' as any);
      }
      setIsLoading(false);
    };
    loadTheme();
  }, []);

  // Theme is directly the preference (no system mode)
  const actualTheme = themePreference;

  // Update theme preference
  const setTheme = async (preference: ThemeMode) => {
    setThemePreference(preference);
    await saveThemePreference(preference as any);
  };

  const colors = Colors[actualTheme];
  const isDark = actualTheme === 'dark';

  const value: ThemeContextType = {
    colors,
    isDark,
    theme: actualTheme,
    themePreference,
    setTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
