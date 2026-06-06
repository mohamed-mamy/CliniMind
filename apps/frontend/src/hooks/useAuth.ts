import { useState, useEffect } from 'react';
import { authStore, User } from '../store/authStore';
import { LangKey } from '../services/localization';

export function useAuth() {
  const [user, setUser] = useState<User | null>(authStore.getAuth());
  const [lang, setLangState] = useState<LangKey>(authStore.getLang());
  const [darkMode, setDarkModeState] = useState<boolean>(authStore.getDarkMode());
  const [clinicName, setClinicNameState] = useState<string>(authStore.getClinicName());

  useEffect(() => {
    // Initial load from storage
    authStore.initialize();
    
    setUser(authStore.getAuth());
    setLangState(authStore.getLang());
    setDarkModeState(authStore.getDarkMode());
    setClinicNameState(authStore.getClinicName());

    const unsubscribe = authStore.subscribe(() => {
      setUser(authStore.getAuth());
      setLangState(authStore.getLang());
      setDarkModeState(authStore.getDarkMode());
      setClinicNameState(authStore.getClinicName());
    });

    return unsubscribe;
  }, []);

  const setAuth = (u: User | null, accessToken?: string, refreshToken?: string) => authStore.setAuth(u, accessToken, refreshToken);
  const setLang = (l: LangKey) => authStore.setLang(l);
  const setDarkMode = (d: boolean) => authStore.setDarkMode(d);

  return {
    user,
    lang,
    darkMode,
    clinicName,
    setAuth,
    setLang,
    setDarkMode,
    isLoggedIn: !!user,
  };
}
