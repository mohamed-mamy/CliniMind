import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { t, LangKey } from '../../services/localization';
import { authService } from '../../services/authService';

export default function Login() {
  const { lang, setLang, setAuth } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginErrorMsg, setLoginErrorMsg] = useState('');
  const [biometricToastText, setBiometricToastText] = useState('');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const activeTrans = t[lang];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setLoginErrorMsg('');

    try {
      const user = await authService.login(username, password);
      setAuth(user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLoginErrorMsg(err.message);
      } else {
        setLoginErrorMsg(activeTrans.loginError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricClick = () => {
    setBiometricToastText(activeTrans.biometricToast);
    setTimeout(async () => {
      try {
        const user = await authService.login('director', '1234');
        setAuth(user);
      } catch {
        setLoginErrorMsg(activeTrans.loginError);
      }
      setBiometricToastText('');
    }, 1500);
  };

  const changeLanguage = (newLang: LangKey) => {
    setLang(newLang);
    setShowLangDropdown(false);
  };

  return (
    <div dir={activeTrans.dir} className="flex-1 w-full flex items-center justify-center bg-radial-at-t from-slate-800 to-slate-950 p-4 relative overflow-hidden min-h-screen">
      {/* Glowing abstract backgrounds */}
      <div className="absolute h-96 w-96 rounded-full bg-sky-500/10 blur-3xl top-1/4 -right-10 pointer-events-none"></div>
      <div className="absolute h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl bottom-1/4 -left-10 pointer-events-none"></div>

      {/* Login Card Form */}
      <div className="w-full max-w-sm rounded-[32px] border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md relative z-10 text-center animate-fadeIn">
        
        {/* CliniMind Logo Title */}
        <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
          {activeTrans.appName}
        </h2>
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          {activeTrans.loginSubtitle}
        </p>

        <form onSubmit={handleLoginSubmit} className="mt-8 space-y-4">
          {/* Username Input */}
          <div className="relative">
            <input
              type="text"
              required
              disabled={loading}
              placeholder={activeTrans.usernamePlaceholder}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-800/60 py-3.5 ps-4 pe-12 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-start"
            />
            <span className="absolute top-1/2 -translate-y-1/2 end-4 text-slate-500">
              <svg className="h-4 w-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
          </div>

          {/* Password Input */}
          <div className="relative">
            <input
              type="password"
              required
              disabled={loading}
              placeholder={activeTrans.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-800/60 py-3.5 ps-4 pe-12 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-start"
            />
            <span className="absolute top-1/2 -translate-y-1/2 end-4 text-slate-500">
              <svg className="h-4 w-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
          </div>

          {/* Forgot password */}
          <div className="text-start">
            <a href="#" className="text-xs text-slate-400 hover:text-sky-400 transition-colors">
              {activeTrans.forgotPassword}
            </a>
          </div>

          {/* Error Message */}
          {loginErrorMsg && (
            <div className="rounded-xl bg-red-900/30 p-3 text-xs text-red-400 text-center border border-red-900/40">
              {loginErrorMsg}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-sky-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 hover:shadow-sky-500/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              activeTrans.loginBtn
            )}
          </button>
        </form>

        {/* Biometric login */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col items-center gap-3">
          <button
            onClick={handleBiometricClick}
            disabled={loading}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-sky-400 hover:bg-slate-750 transition-colors active:scale-95 shadow-md cursor-pointer"
            title={activeTrans.biometricLogin}
          >
            {/* Fingerprint icon */}
            <svg className="h-6 w-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 0 0-8 4M12 2a10 10 0 0 1 8 4M12 12a10 10 0 0 0-2 6M12 12c1 0 2.5 1 3 3M8 9a10 10 0 0 1 8 0M6 12a12 12 0 0 1 12 0" />
              <path d="M12 8v8M10 15c0-1.5 1-3 2-3" />
            </svg>
          </button>
          <span className="text-[11px] font-semibold text-slate-400">
            {activeTrans.biometricLogin}
          </span>
        </div>

        {/* Biometric loading feedback toast */}
        {biometricToastText && (
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-64 rounded-xl bg-slate-900 border border-slate-700 py-2.5 px-4 text-xs font-semibold text-sky-400 text-center animate-fadeIn shadow-xl">
            {biometricToastText}
          </div>
        )}

        {/* Globe Language selector */}
        <div className="mt-8 flex justify-start">
          <div className="relative">
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <svg className="h-4 w-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>{lang === 'ar' ? 'العربية' : lang === 'en' ? 'English' : 'Français'}</span>
            </button>

            {/* Dropdown Options */}
            {showLangDropdown && (
              <div className="absolute bottom-6 left-0 z-30 w-32 rounded-xl border border-slate-800 bg-slate-850 p-1.5 shadow-xl text-left">
                <button
                  type="button"
                  onClick={() => changeLanguage('ar')}
                  className="w-full text-right rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                >
                  العربية
                </button>
                <button
                  type="button"
                  onClick={() => changeLanguage('en')}
                  className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => changeLanguage('fr')}
                  className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                >
                  Français
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
