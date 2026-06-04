import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { t } from '../../services/localization';

export default function Settings() {
  const { lang, user } = useAuth();
  const activeTrans = t[lang];
  const isDirector = user?.role === 'director';

  // State values (Clinic information)
  const [clinicName, setClinicName] = useState('عيادة الطب الشامل');
  const [clinicAddress, setClinicAddress] = useState('طريق الملك عبد العزيز، الرياض');
  const [clinicFee, setClinicFee] = useState(150);

  // SMTP Settings (Director only)
  const [smtpHost, setSmtpHost] = useState('smtp.clinimind.com');
  const [smtpUser, setSmtpUser] = useState('notification@clinimind.com');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    alert(lang === 'ar' ? 'تم حفظ الإعدادات بنجاح!' : 'Settings updated successfully!');
  };

  return (
    <div className="animate-fadeIn space-y-6 text-start">
      <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{activeTrans.tabSettings}</h2>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle: Editable fields or read-only based on role */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* General settings card */}
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

          {/* SMTP configurations (Director only) */}
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
                    required
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'اسم المستخدم / البريد' : 'Username email'}</label>
                  <input
                    type="email"
                    required
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                <input
                  type="password"
                  disabled
                  placeholder="••••••••••••"
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-100 p-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {lang === 'ar' ? 'يتم تشفير وحجب كلمة المرور تلقائياً لحماية خصوصية بيانات خادم البريد.' : 'SMTP secrets are masked for safety.'}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-250 p-6 text-center text-xs text-slate-400 dark:border-slate-800">
              {lang === 'ar' ? 'إعدادات البريد SMTP مقيدة ومخفية لأسباب أمنية.' : 'SMTP config hidden for non-director roles.'}
            </div>
          )}
        </div>

        {/* Right side: Action Save and Threshold lists */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl border border-slate-150 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 border-b border-slate-100 pb-3 dark:border-slate-800">
              {lang === 'ar' ? 'حفظ التعديلات' : 'Save actions'}
            </h3>
            
            {isDirector ? (
              <button
                type="submit"
                className="w-full rounded-2xl bg-sky-850 py-3.5 text-xs font-bold text-white shadow-md hover:bg-sky-700 dark:bg-sky-600 cursor-pointer text-center"
              >
                {lang === 'ar' ? 'تطبيق وحفظ التغييرات' : 'Save changes'}
              </button>
            ) : (
              <p className="text-xs text-slate-400 italic">
                {lang === 'ar' ? 'أنت في وضع القراءة فقط، لا تمتلك صلاحيات تعديل هذه الإعدادات.' : 'You have view-only access to settings.'}
              </p>
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
