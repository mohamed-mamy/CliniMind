import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { t } from '../../services/localization';
import { api, Invoice, LabRequest } from '../../services/api';

export default function Dashboard() {
  const { lang } = useAuth();
  const { notifications } = useNotifications();
  
  const [totalRevenue, setTotalRevenue] = useState(8450);
  const [pendingLabsCount, setPendingLabsCount] = useState(0);

  const activeTrans = t[lang];
  const isRTL = activeTrans.dir === 'rtl';

  useEffect(() => {
    // Dynamically calculate metrics from api services
    api.getInvoices().then((res) => {
      if (res.success && res.data) {
        // sum up revenue
        const total = res.data.reduce((sum: number, inv: Invoice) => sum + inv.paidAmount, 0);
        if (total > 0) setTotalRevenue(total);
      }
    });

    api.getLabRequests().then((res) => {
      if (res.success && res.data) {
        const pending = res.data.filter((req: LabRequest) => req.status !== 'completed').length;
        setPendingLabsCount(pending);
      }
    });
  }, []);

  return (
    <div className="animate-fadeIn space-y-6">
      <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
        {activeTrans.tabDashboard}
      </h2>

      {/* Desktop Stats Card Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Patients Metric */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <svg className="h-6 w-6 stroke-current stroke-2 fill-none text-sky-500" viewBox="0 0 24 24">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{activeTrans.statsTotalPatients}</span>
          </div>
          <div className="mt-4 text-start">
            <h3 className="text-3xl font-black text-slate-850 dark:text-slate-50">1,248</h3>
            <p className="mt-1 text-[11px] font-bold text-emerald-600">
              ▲ +12% {activeTrans.statsMonthlyTrend}
            </p>
          </div>
        </div>

        {/* Visitors Metric */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <svg className="h-6 w-6 stroke-current stroke-2 fill-none text-indigo-500" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{activeTrans.statsTodayVisitors}</span>
          </div>
          <div className="mt-4 text-start">
            <h3 className="text-3xl font-black text-slate-850 dark:text-slate-50">42</h3>
            <p className="mt-1 text-[11px] font-bold text-amber-600">
              ● 5 {activeTrans.statsInWaiting}
            </p>
          </div>
        </div>

        {/* Lab Pending Metric */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <svg className="h-6 w-6 stroke-current stroke-2 fill-none text-red-500" viewBox="0 0 24 24">
              <path d="M4.5 3h15M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3M12 3v18" />
            </svg>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{activeTrans.statsPendingLabs}</span>
          </div>
          <div className="mt-4 text-start">
            <h3 className="text-3xl font-black text-slate-850 dark:text-slate-50">
              {pendingLabsCount > 0 ? pendingLabsCount : 18}
            </h3>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-950/20 dark:text-red-400">
              ▲ 3 {activeTrans.statsCritical}
            </span>
          </div>
        </div>

        {/* Revenue Metric */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <svg className="h-6 w-6 stroke-current stroke-2 fill-none text-emerald-500" viewBox="0 0 24 24">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="12" y1="4" x2="12" y2="20" />
            </svg>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{activeTrans.statsTodayRevenue}</span>
          </div>
          <div className="mt-4 text-start">
            <h3 className="text-2xl font-black text-slate-850 dark:text-slate-50">
              {totalRevenue.toLocaleString()} {activeTrans.currency}
            </h3>
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full w-4/5 rounded-full bg-emerald-500"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout for Alerts & Revenue Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-extrabold text-red-700 dark:bg-red-950/30 dark:text-red-300">
              {notifications.length} {activeTrans.newAlerts}
            </span>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {activeTrans.urgentNotifications}
            </h3>
          </div>

          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex gap-4 rounded-2xl border p-4 text-start ${
                notif.type === 'critical'
                  ? 'border-red-100 bg-red-50/30 dark:border-red-950/20 dark:bg-red-950/10'
                  : 'border-amber-100 bg-amber-50/20 dark:border-amber-950/20 dark:bg-amber-950/10'
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  notif.type === 'critical'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200'
                }`}
              >
                <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                </svg>
              </div>
              <div className="flex-1">
                <h4
                  className={`text-xs font-bold ${
                    notif.type === 'critical' ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {notif.title}
                </h4>
                <p
                  className={`mt-1 text-[11px] leading-relaxed ${
                    notif.type === 'critical' ? 'text-red-750 dark:text-red-400' : 'text-amber-750 dark:text-amber-400'
                  }`}
                >
                  {notif.description}
                </p>
                <span
                  className={`mt-1.5 block text-[10px] font-bold ${
                    notif.type === 'critical' ? 'text-red-500' : 'text-amber-500'
                  }`}
                >
                  {notif.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart panel */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {activeTrans.last7Days}
            </span>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {activeTrans.revenueTrends}
            </h3>
          </div>

          {/* Large Desktop Area Chart */}
          <div className="relative h-60 w-full">
            <svg className="h-full w-full" viewBox="0 0 100 35" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartDesktopGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <line x1="0" y1="8" x2="100" y2="8" stroke="#f1f5f9" strokeWidth="0.3" className="dark:stroke-slate-800" />
              <line x1="0" y1="16" x2="100" y2="16" stroke="#f1f5f9" strokeWidth="0.3" className="dark:stroke-slate-800" />
              <line x1="0" y1="24" x2="100" y2="24" stroke="#f1f5f9" strokeWidth="0.3" className="dark:stroke-slate-800" />

              {/* Gradient Fill */}
              <path
                d="M0 35 L0 26 Q15 22 30 25 T65 15 T90 9 L100 8 L100 35 Z"
                fill="url(#chartDesktopGrad)"
              />
              {/* Path Line */}
              <path
                d="M0 26 Q15 22 30 25 T65 15 T90 9 L100 8"
                fill="none"
                stroke="#0284c7"
                strokeWidth="1.5"
                className="dark:stroke-sky-400"
              />

              {/* Hover point circle marker */}
              <circle cx="90" cy="9" r="2" fill="#0284c7" stroke="#ffffff" strokeWidth="0.8" className="dark:fill-sky-400" />
            </svg>
            
            {/* Interactive Tooltip Overlay */}
            <div className={`absolute top-2 rounded-xl bg-slate-900 border border-slate-800 py-1.5 px-3 text-[10px] font-bold text-sky-400 shadow-md ${isRTL ? 'left-6' : 'right-6'}`}>
              {activeTrans.today}: {totalRevenue.toLocaleString()} {activeTrans.currency}
            </div>
          </div>

          {/* X Axis Labels */}
          <div className="mt-4 flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500">
            <span>{lang === 'ar' ? 'الأحد' : lang === 'en' ? 'Sun' : 'Dim'}</span>
            <span>{lang === 'ar' ? 'الإثنين' : lang === 'en' ? 'Mon' : 'Lun'}</span>
            <span>{lang === 'ar' ? 'الثلاثاء' : lang === 'en' ? 'Tue' : 'Mar'}</span>
            <span>{lang === 'ar' ? 'الأربعاء' : lang === 'en' ? 'Wed' : 'Mer'}</span>
            <span>{lang === 'ar' ? 'الخميس' : lang === 'en' ? 'Thu' : 'Jeu'}</span>
            <span>{lang === 'ar' ? 'الجمعة' : lang === 'en' ? 'Fri' : 'Ven'}</span>
            <span>{lang === 'ar' ? 'السبت' : lang === 'en' ? 'Sat' : 'Sam'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
