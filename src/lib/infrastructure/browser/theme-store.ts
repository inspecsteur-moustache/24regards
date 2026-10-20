import type { Theme, ThemePreferenceStore } from '../../domain/ports';
export function createThemeStore(): ThemePreferenceStore {
  return {
    read() {
      try {
        const value = localStorage.getItem('24regards-theme');
        return value === 'dark' || value === 'light' ? value : undefined;
      } catch {
        return undefined;
      }
    },
    write(theme: Theme) {
      try {
        localStorage.setItem('24regards-theme', theme);
      } catch {
        /* Reading remains available when storage is disabled. */
      }
    },
  };
}
