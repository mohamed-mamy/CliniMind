import { useState, useEffect } from 'react';
import { authStore, User } from '../store/authStore';
import { LangKey } from '../services/localization';
import axios from 'axios';

export function useAuth() {
  const [user, setUser] = useState<User | null>(authStore.getAuth());
  const [lang, setLangState] = useState<LangKey>(authStore.getLang());
  const [darkMode, setDarkModeState] = useState<boolean>(authStore.getDarkMode());
  const [clinicName, setClinicNameState] = useState<string>(authStore.getClinicName());
  const [isValidating, setIsValidating] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    // Initial load from storage
    authStore.initialize();

    const savedUser = authStore.getAuth();
    const savedToken = authStore.getAccessToken();

    setUser(savedUser);
    setLangState(authStore.getLang());
    setDarkModeState(authStore.getDarkMode());
    setClinicNameState(authStore.getClinicName());

    // Validate token against backend on startup
    if (savedUser && savedToken) {
      axios
        .get('/v1/auth/me', {
          headers: { Authorization: `Bearer ${savedToken}` },
        })
        .then(() => {
          if (!cancelled) setIsValidating(false);
        })
        .catch(async (err) => {
          if (cancelled) return;
          const code = err.response?.data?.error?.code;
          if (code === 'TOKEN_EXPIRED') {
            // Attempt refresh
            const rt = authStore.getRefreshToken();
            if (rt) {
              try {
                const refreshRes = await axios.post('/v1/auth/refresh', { refreshToken: rt });
                const data = refreshRes.data.data;
                authStore.setAuth(data.user, data.accessToken, data.refreshToken);
                setUser(data.user);
              } catch {
                authStore.setAuth(null);
                setUser(null);
              }
            } else {
              authStore.setAuth(null);
              setUser(null);
            }
          } else {
            authStore.setAuth(null);
            setUser(null);
          }
          if (!cancelled) setIsValidating(false);
        });
    } else {
      setIsValidating(false);
    }

    const unsubscribe = authStore.subscribe(() => {
      setUser(authStore.getAuth());
      setLangState(authStore.getLang());
      setDarkModeState(authStore.getDarkMode());
      setClinicNameState(authStore.getClinicName());
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const setAuth = (u: User | null, accessToken?: string, refreshToken?: string) => authStore.setAuth(u, accessToken, refreshToken);
  const setLang = (l: LangKey) => authStore.setLang(l);
  const setDarkMode = (d: boolean) => authStore.setDarkMode(d);

  return {
    user,
    lang,
    darkMode,
    clinicName,
    isValidating,
    setAuth,
    setLang,
    setDarkMode,
    isLoggedIn: !!user,
  };
}
