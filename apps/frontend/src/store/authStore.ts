import { LangKey } from '../services/localization';

export interface User {
  fullName: string;
  role: 'director' | 'doctor' | 'receptionist' | 'lab_technician';
}

let currentAuth: User | null = null;
let currentLang: LangKey = 'ar';
let isDarkTheme: boolean = false;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(l => l());
}

export const authStore = {
  getAuth: () => currentAuth,
  setAuth: (user: User | null) => {
    currentAuth = user;
    emit();
  },
  getLang: () => currentLang,
  setLang: (lang: LangKey) => {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    emit();
  },
  getDarkMode: () => isDarkTheme,
  setDarkMode: (dark: boolean) => {
    isDarkTheme = dark;
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    emit();
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  initialize: () => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('lang') as LangKey;
      if (savedLang) currentLang = savedLang;
      
      const isDark = localStorage.getItem('theme') === 'dark';
      isDarkTheme = isDark;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      emit();
    }
  }
};
