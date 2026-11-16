import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type ThemeMode = 'light' | 'dark';
type Preferences = { themeMode: ThemeMode; setThemeMode: (mode: ThemeMode) => void };
const Context = createContext<Preferences>({ themeMode: 'light', setThemeMode: () => undefined });
const STORAGE_KEY = 'ibudget-theme-mode';

async function readMode(): Promise<ThemeMode> {
  try {
    const stored = Platform.OS === 'web' ? (typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY)) : await SecureStore.getItemAsync(STORAGE_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  } catch { return 'light'; }
}
async function writeMode(mode: ThemeMode) {
  try {
    if (Platform.OS === 'web') { if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, mode); }
    else await SecureStore.setItemAsync(STORAGE_KEY, mode);
  } catch { /* Theme remains active for this session even if storage is unavailable. */ }
}

export function AppPreferencesProvider({ children }: React.PropsWithChildren) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  useEffect(() => { void readMode().then(setThemeModeState); }, []);
  useEffect(() => { Appearance.setColorScheme(themeMode); }, [themeMode]);
  const value = useMemo<Preferences>(() => ({ themeMode, setThemeMode: mode => { setThemeModeState(mode); void writeMode(mode); } }), [themeMode]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAppPreferences() { return useContext(Context); }
