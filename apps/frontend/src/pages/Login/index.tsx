import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { t, LangKey } from '../../services/localization';
import { authService } from '../../services/authService';
import { api } from '../../services/api';

export default function Login() {
  const { lang, setLang, setAuth } = useAuth();
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login');
  
  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Reset fields
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loginErrorMsg, setLoginErrorMsg] = useState('');
  const [msg, setMsg] = useState('');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clinicName, setClinicName] = useState('CliniMind');

  useEffect(() => {
    api.getPublicSettings().then(res => {
      if (res.success && res.data?.clinicName) {
        setClinicName(res.data.clinicName);
        document.title = res.data.clinicName;
      }
    }).catch(() => {});
  }, []);

  const activeTrans = t[lang];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setLoginErrorMsg('');
    setMsg('');

    try {
      const { user, accessToken, refreshToken } = await authService.login(username, password);
      setAuth(user, accessToken, refreshToken);
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

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setLoginErrorMsg('');
    setMsg('');

    try {
      await authService.forgotPassword(email);
      setMsg(lang === 'ar' ? 'تم إرسال رمز التحقق إلى بريدك الإلكتروني.' : 'Verification code sent to your email.');
      setView('reset');
    } catch (err: any) {
      setLoginErrorMsg(lang === 'ar' ? 'البريد الإلكتروني غير مسجل لدينا.' : 'Email is not registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !code.trim() || !newPassword.trim()) return;

    setLoading(true);
    setLoginErrorMsg('');
    setMsg('');

    try {
      await authService.resetPassword(email, code, newPassword);
      setMsg(lang === 'ar' ? 'تم تغيير كلمة المرور بنجاح. يرجى تسجيل الدخول.' : 'Password reset successfully. Please log in.');
      setView('login');
      setPassword('');
      setUsername('');
    } catch (err: any) {
      setLoginErrorMsg(lang === 'ar' ? 'الرمز غير صحيح أو انتهت صلاحيته.' : 'Invalid code or code expired.');
    } finally {
      setLoading(false);
    }
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
        
        {/* Clinic Logo Title */}
        <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
          {clinicName}
        </h2>
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          {view === 'login' && activeTrans.loginSubtitle}
          {view === 'forgot' && (lang === 'ar' ? 'أدخل بريدك الإلكتروني لإرسال رمز التحقق' : 'Enter email to send verification code')}
          {view === 'reset' && (lang === 'ar' ? 'أدخل الرمز المستلم وكلمة المرور الجديدة' : 'Enter received code and new password')}
        </p>

        {view === 'login' && (
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
              <button
                type="button"
                onClick={() => { setView('forgot'); setLoginErrorMsg(''); setMsg(''); }}
                className="text-xs text-slate-400 hover:text-sky-400 transition-colors bg-transparent border-0 p-0 cursor-pointer"
              >
                {activeTrans.forgotPassword}
              </button>
            </div>

            {/* Error Message */}
            {loginErrorMsg && (
              <div className="rounded-xl bg-red-900/30 p-3 text-xs text-red-400 text-center border border-red-900/40 animate-fadeIn">
                {loginErrorMsg}
              </div>
            )}

            {/* Msg */}
            {msg && (
              <div className="rounded-xl bg-green-900/30 p-3 text-xs text-green-400 text-center border border-green-900/40 animate-fadeIn">
                {msg}
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
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="mt-8 space-y-4">
            {/* Email Input */}
            <div className="relative">
              <input
                type="email"
                required
                disabled={loading}
                placeholder={lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-800/60 py-3.5 ps-4 pe-12 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-start"
              />
              <span className="absolute top-1/2 -translate-y-1/2 end-4 text-slate-500">
                <svg className="h-4 w-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
            </div>

            {/* Error Message */}
            {loginErrorMsg && (
              <div className="rounded-xl bg-red-900/30 p-3 text-xs text-red-400 text-center border border-red-900/40 animate-fadeIn">
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
                lang === 'ar' ? 'إرسال رمز التحقق' : 'Send Verification Code'
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setView('login'); setLoginErrorMsg(''); setMsg(''); }}
                className="text-xs text-sky-400 hover:text-sky-300 transition-colors bg-transparent border-0 p-0 cursor-pointer"
              >
                {lang === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
              </button>
            </div>
          </form>
        )}

        {view === 'reset' && (
          <form onSubmit={handleResetSubmit} className="mt-8 space-y-4">
            {/* Email Input (readonly) */}
            <div className="relative">
              <input
                type="email"
                required
                readOnly
                placeholder={lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                value={email}
                className="w-full rounded-2xl border border-slate-700 bg-slate-800/30 py-3.5 ps-4 pe-12 text-sm text-slate-450 text-start outline-none"
              />
              <span className="absolute top-1/2 -translate-y-1/2 end-4 text-slate-600">
                <svg className="h-4 w-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
            </div>

            {/* Code Input */}
            <div className="relative">
              <input
                type="text"
                required
                maxLength={6}
                disabled={loading}
                placeholder={lang === 'ar' ? 'رمز التحقق (6 أرقام)' : 'Verification Code (6 digits)'}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-800/60 py-3.5 ps-4 pe-12 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-start"
              />
              <span className="absolute top-1/2 -translate-y-1/2 end-4 text-slate-500">
                <svg className="h-4 w-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
            </div>

            {/* New Password Input */}
            <div className="relative">
              <input
                type="password"
                required
                disabled={loading}
                placeholder={lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-800/60 py-3.5 ps-4 pe-12 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-start"
              />
              <span className="absolute top-1/2 -translate-y-1/2 end-4 text-slate-500">
                <svg className="h-4 w-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
            </div>

            {/* Error Message */}
            {loginErrorMsg && (
              <div className="rounded-xl bg-red-900/30 p-3 text-xs text-red-400 text-center border border-red-900/40 animate-fadeIn">
                {loginErrorMsg}
              </div>
            )}

            {/* Msg */}
            {msg && (
              <div className="rounded-xl bg-green-900/30 p-3 text-xs text-green-400 text-center border border-green-900/40 animate-fadeIn">
                {msg}
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
                lang === 'ar' ? 'تعيين كلمة المرور الجديدة' : 'Reset Password'
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setView('login'); setLoginErrorMsg(''); setMsg(''); }}
                className="text-xs text-sky-400 hover:text-sky-300 transition-colors bg-transparent border-0 p-0 cursor-pointer"
              >
                {lang === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
              </button>
            </div>
          </form>
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
