import { useState, useEffect } from 'react';
import { authStore, User } from '../store/authStore';
import { LangKey } from '../services/localization';

export function useAuth() {
  const [user, setUser] = useState<User | null>(authStore.getAuth());
  const [lang, setLangState] = useState<LangKey>(authStore.getLang());
  const [darkMode, setDarkModeState] = useState<boolean>(authStore.getDarkMode());

  useEffect(() => {
    // Initial load from storage
    authStore.initialize();
    
    setUser(authStore.getAuth());
    setLangState(authStore.getLang());
    setDarkModeState(authStore.getDarkMode());

    const unsubscribe = authStore.subscribe(() => {
      setUser(authStore.getAuth());
      setLangState(authStore.getLang());
      setDarkModeState(authStore.getDarkMode());
    });

    return unsubscribe;
  }, []);

  const setAuth = (u: User | null) => authStore.setAuth(u);
  const setLang = (l: LangKey) => authStore.setLang(l);
  const setDarkMode = (d: boolean) => authStore.setDarkMode(d);

  return {
    user,
    lang,
    darkMode,
    setAuth,
    setLang,
    setDarkMode,
    isLoggedIn: !!user,
  };
}
