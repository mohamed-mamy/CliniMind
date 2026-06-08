import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { t } from '../../services/localization';
import { api } from '../../services/api';
import { authStore } from '../../store/authStore';

export default function Settings() {
  const { lang, user } = useAuth();
  const activeTrans = t[lang];
  const isDirector = user?.role === 'director';

  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicFee, setClinicFee] = useState(0);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getSettings().then(res => {
      if (res.success && res.data) {
        setClinicName(res.data.clinicName || '');
        setClinicAddress(res.data.clinicAddress || '');
        setClinicFee(res.data.defaultConsultationFee ?? 0);
        if (res.data.smtpConfig?.host) setSmtpHost(res.data.smtpConfig.host);
        if (res.data.smtpConfig?.smtpUser) setSmtpUser(res.data.smtpConfig.smtpUser);
        if (res.data.smtpConfig?.smtpPass && res.data.smtpConfig.smtpPass !== '••••••••') setSmtpPass(res.data.smtpConfig.smtpPass);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      const body: any = {
        clinicName,
        clinicAddress,
        defaultConsultationFee: clinicFee,
      };
      if (smtpHost || smtpUser) {
        body.smtpConfig = { host: smtpHost, smtpUser };
        if (smtpPass) body.smtpConfig.smtpPass = smtpPass;
      }
      const res = await api.updateSettings(body);
      if (res.success) {
        authStore.setClinicName(clinicName);
        setMessage(lang === 'ar' ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!');
      }
    } catch {
      setMessage(lang === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fadeIn text-center py-20 text-slate-400 text-sm">
        {lang === 'ar' ? 'جاري تحميل الإعدادات...' : 'Loading settings...'}
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-6 text-start">
      <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{activeTrans.tabSettings}</h2>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          <div className="rounded-3xl border border-slate-150 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 border-b border-slate-100 pb-3 dark:border-slate-800">
              {lang === 'ar' ? 'معلومات العيادة العامة' : 'General Clinic Info'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'اسم العيادة' : 'Clinic Name'}</label>
                <input
                  type="text"
                  required
                  disabled={!isDirector}
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 disabled:opacity-70"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'رسوم الكشفية الافتراضية' : 'Default Consultation Fee'}</label>
                <input
                  type="number"
                  required
                  disabled={!isDirector}
                  value={clinicFee}
                  onChange={(e) => setClinicFee(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 disabled:opacity-70"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'العنوان والموقع' : 'Address Location'}</label>
              <input
                type="text"
                required
                disabled={!isDirector}
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 disabled:opacity-70"
              />
            </div>
          </div>

          {isDirector ? (
            <div className="rounded-3xl border border-slate-150 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 border-b border-slate-100 pb-3 dark:border-slate-800">
                {lang === 'ar' ? 'إعدادات خادم البريد (SMTP)' : 'SMTP Mail Config'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'مضيف الـ SMTP' : 'Host Server'}</label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'اسم المستخدم / البريد' : 'Username email'}</label>
                  <input
                    type="email"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="noreply@example.com"
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="••••••••••••"
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {lang === 'ar' ? 'كلمة مرور خادم البريد الإلكتروني.' : 'SMTP email password.'}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-250 p-6 text-center text-xs text-slate-400 dark:border-slate-800">
              {lang === 'ar' ? 'إعدادات البريد SMTP مقيدة ومخفية لأسباب أمنية.' : 'SMTP config hidden for non-director roles.'}
            </div>
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl border border-slate-150 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 border-b border-slate-100 pb-3 dark:border-slate-800">
              {lang === 'ar' ? 'حفظ التعديلات' : 'Save actions'}
            </h3>

            {isDirector ? (
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-sky-850 py-3.5 text-xs font-bold text-white shadow-md hover:bg-sky-700 dark:bg-sky-600 cursor-pointer text-center disabled:opacity-60"
              >
                {saving
                  ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                  : (lang === 'ar' ? 'تطبيق وحفظ التغييرات' : 'Save changes')}
              </button>
            ) : (
              <p className="text-xs text-slate-400 italic">
                {lang === 'ar' ? 'أنت في وضع القراءة فقط، لا تمتلك صلاحيات تعديل هذه الإعدادات.' : 'You have view-only access to settings.'}
              </p>
            )}

            {message && (
              <p className="text-xs text-center text-green-600 dark:text-green-400 font-bold">{message}</p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-150 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h4 className="font-extrabold text-xs text-sky-850 dark:text-sky-400 uppercase tracking-wide">
              {lang === 'ar' ? 'العتبات الطبية للإنذار' : 'Medical Threshold alerts'}
            </h4>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-slate-50 pb-2 dark:border-slate-800">
                <span className="text-slate-450">{lang === 'ar' ? 'مستوى البوتاسيوم الأقصى' : 'Max Potassium'}:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">6.0 mmol/L</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2 dark:border-slate-800">
                <span className="text-slate-450">{lang === 'ar' ? 'مستوى السكر الأقصى' : 'Max Glycemia'}:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">125 mg/dL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450">{lang === 'ar' ? 'الضغط الانقباضي الأقصى' : 'Max Systolic'}:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">140 mmHg</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
