import { useAuth } from '../../hooks/useAuth';
import { t } from '../../services/localization';

export default function Reports() {
  const { lang, user } = useAuth();
  const activeTrans = t[lang];
  const isDirector = user?.role === 'director';

  if (!isDirector) {
    return (
      <div className="animate-fadeIn py-16 text-center max-w-md mx-auto space-y-4">
        <div className="h-16 w-16 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600 dark:bg-red-950/20">
          <svg className="h-8 w-8 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {lang === 'ar' ? 'غير مسموح بالوصول' : 'Access Denied'}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {lang === 'ar' 
            ? 'عذراً، هذه الصفحة مخصصة لمدير العيادة فقط للوصول إلى التقارير المالية والتحليلية.' 
            : 'Sorry, this page is restricted to the clinic director to access financial and analytical reports.'}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{activeTrans.tabReports}</h2>

      {/* Grid for Reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-start">
        {/* CA Card */}
        <div className="rounded-3xl border border-slate-150 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">
            {lang === 'ar' ? 'إجمالي الدخل / رقم الأعمال' : 'Revenue Turnover'}
          </span>
          <span className="text-2xl font-black text-emerald-600 block mt-2">
            + 85,450 {activeTrans.currency}
          </span>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">خلال الـ 30 يوماً الماضية</p>
        </div>

        {/* Expenses Card */}
        <div className="rounded-3xl border border-slate-150 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">
            {lang === 'ar' ? 'إجمالي المصاريف والمخارج' : 'Total Spent'}
          </span>
          <span className="text-2xl font-black text-red-500 block mt-2">
            - 13,950 {activeTrans.currency}
          </span>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">الرواتب، المستلزمات الطبية، الفواتير</p>
        </div>

        {/* Net Profit Card */}
        <div className="rounded-3xl border border-slate-150 bg-slate-900 text-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-900/60">
          <span className="text-[10px] font-bold text-sky-400 block uppercase">
            {lang === 'ar' ? 'صافي الأرباح' : 'Net Benefit'}
          </span>
          <span className="text-2xl font-black block mt-2">
            + 71,500 {activeTrans.currency}
          </span>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full w-4/5 rounded-full bg-sky-400"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-start">
        {/* Diagnostic analytics */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
            {lang === 'ar' ? 'التحاليل والتشخيصات الأكثر شيوعاً' : 'Top Common Diagnostics'}
          </h3>
          <div className="space-y-3.5">
            {[
              { name: lang === 'ar' ? 'غازات الدم الشرياني (ABG)' : 'Arterial Blood Gas', count: 48, pct: '80%' },
              { name: lang === 'ar' ? 'تحليل بول كامل' : 'Complete Urinalysis', count: 32, pct: '53%' },
              { name: lang === 'ar' ? 'وظائف الكبد (LFT)' : 'Liver Function Test', count: 24, pct: '40%' },
              { name: lang === 'ar' ? 'تخطيط قلب كامل (ECG)' : 'Electrocardiogram', count: 18, pct: '30%' }
            ].map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-350">
                  <span>{item.name}</span>
                  <span>{item.count} {lang === 'ar' ? 'حالة' : 'cases'}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-sky-500" style={{ width: item.pct }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance stats */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
            {lang === 'ar' ? 'تقرير المواعيد والحضور' : 'Appt Attendance report'}
          </h3>
          <div className="space-y-4 text-xs font-medium text-slate-650 dark:text-slate-350">
            <div className="flex justify-between">
              <span>{lang === 'ar' ? 'مواعيد مؤكدة ومنفذة' : 'Confirmed & Done Appts'}:</span>
              <span className="font-bold text-emerald-600">84%</span>
            </div>
            <div className="flex justify-between">
              <span>{lang === 'ar' ? 'حالات الغياب (No Show)' : 'No-Show Rate'}:</span>
              <span className="font-bold text-amber-600">12%</span>
            </div>
            <div className="flex justify-between">
              <span>{lang === 'ar' ? 'مواعيد ملغاة' : 'Cancelled Appts'}:</span>
              <span className="font-bold text-red-500">4%</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mt-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                {lang === 'ar' ? 'ملاحظة الفاعلية' : 'Efficiency recommendation'}
              </span>
              <p className="leading-relaxed text-[11px] text-slate-500">
                {lang === 'ar' 
                  ? 'يرجى مراجعة إرسال تنبيهات البريد الإلكتروني التلقائية J-1 لتحسين نسبة حضور المرضى وتقليل الغياب.' 
                  : 'Consider automated email reminders to improve schedule capacity and reduce patient absent rates.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
