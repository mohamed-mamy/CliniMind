import { LangKey } from '../services/localization';

export interface User {
  _id?: string;
  fullName: string;
  role: 'director' | 'doctor' | 'receptionist' | 'lab_technician';
  email?: string;
  username?: string;
}

interface AuthData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

let currentAuth: AuthData | null = null;
let currentLang: LangKey = 'ar';
let isDarkTheme: boolean = false;
let currentClinicName: string = '';

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(l => l());
}

export const authStore = {
  getAuth: () => currentAuth?.user ?? null,
  getAccessToken: () => currentAuth?.accessToken ?? null,
  getRefreshToken: () => currentAuth?.refreshToken ?? null,
  getTokens: () => currentAuth ? { accessToken: currentAuth.accessToken, refreshToken: currentAuth.refreshToken } : null,

  setAuth: (user: User | null, accessToken?: string, refreshToken?: string) => {
    if (user && accessToken && refreshToken) {
      currentAuth = { user, accessToken, refreshToken };
      localStorage.setItem('auth', JSON.stringify(currentAuth));
    } else {
      currentAuth = null;
      localStorage.removeItem('auth');
    }
    emit();
  },

  setTokens: (accessToken: string, refreshToken?: string) => {
    if (currentAuth) {
      currentAuth.accessToken = accessToken;
      if (refreshToken) currentAuth.refreshToken = refreshToken;
      localStorage.setItem('auth', JSON.stringify(currentAuth));
      emit();
    }
  },

  getClinicName: () => currentClinicName,
  setClinicName: (name: string) => {
    currentClinicName = name;
    localStorage.setItem('clinicName', name);
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
      const savedAuth = localStorage.getItem('auth');
      if (savedAuth) {
        try {
          currentAuth = JSON.parse(savedAuth);
        } catch {
          currentAuth = null;
        }
      }

      const savedLang = localStorage.getItem('lang') as LangKey;
      if (savedLang) currentLang = savedLang;

      const savedClinicName = localStorage.getItem('clinicName');
      if (savedClinicName) currentClinicName = savedClinicName;

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
