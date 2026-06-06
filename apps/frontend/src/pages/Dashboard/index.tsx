import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { t } from '../../services/localization';
import { api, Invoice, LabRequest, Appointment, Patient } from '../../services/api';

interface TrendItem {
  date: string;
  revenue: number;
  count: number;
}

interface ReceptionistDashboardData {
  stats: {
    todayAppointments: number;
    todayCheckedIn: number;
    todayRevenue: number;
    waitingRoomCount: number;
  };
  todayAgenda: Appointment[];
  recentInvoices: Invoice[];
}

export default function Dashboard() {
  const { lang, user } = useAuth();
  const { notifications } = useNotifications();

  const [recpData, setRecpData] = useState<ReceptionistDashboardData | null>(null);
  
  const [totalPatients, setTotalPatients] = useState(0);
  const [todayVisitors, setTodayVisitors] = useState(0);
  const [pendingLabsCount, setPendingLabsCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [trendTotal, setTrendTotal] = useState(0);

  const activeTrans = t[lang];
  const isReceptionist = user?.role === 'receptionist';

  useEffect(() => {
    if (isReceptionist) {
      api.getReceptionistDashboard().then((res) => {
        if (res.success && res.data) setRecpData(res.data);
      });
      return;
    }

    api.getPatients().then((res) => {
      if (res.success && res.data) setTotalPatients(res.data.length);
    });

    api.getAppointments().then((res) => {
      if (res.success && res.data) setTodayVisitors(res.data.length);
    });

    api.getInvoices().then((res) => {
      if (res.success && res.data) {
        const total = res.data.reduce((sum: number, inv: Invoice) => sum + inv.paidAmount, 0);
        setTotalRevenue(total);
      }
    });

    api.getLabRequests().then((res) => {
      if (res.success && res.data) {
        const pending = res.data.filter((req: LabRequest) => req.status !== 'completed').length;
        setPendingLabsCount(pending);
      }
    });

    api.getRevenueTrends(7).then((res) => {
      if (res.success && res.data) {
        setTrends(res.data.trends || []);
        setTrendTotal(res.data.totalRevenue || 0);
      }
    }).catch(() => {});
  }, [isReceptionist]);

  const [quickSearch, setQuickSearch] = useState('');
  const [quickResults, setQuickResults] = useState<Patient[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);

  const loadAllPatients = useCallback(() => {
    api.getPatients().then((res) => {
      if (res.success) setAllPatients(res.data);
    });
  }, []);

  useEffect(() => {
    if (isReceptionist) loadAllPatients();
  }, [isReceptionist, loadAllPatients]);

  useEffect(() => {
    if (quickSearch.length < 2) {
      setQuickResults([]);
      return;
    }
    const q = quickSearch.toLowerCase();
    setQuickResults(
      allPatients.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.fileNumber.includes(q) ||
          p.phonePrimary.includes(q)
      )
    );
  }, [quickSearch, allPatients]);

  if (isReceptionist) {
    return (
      <div className="animate-fadeIn space-y-6">
        <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
          {activeTrans.tabDashboard}
        </h2>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'patients' }))}
            className="flex items-center gap-2 rounded-2xl bg-sky-800 text-white px-4 py-2.5 text-xs font-bold shadow-md hover:bg-sky-700 active:scale-95 dark:bg-sky-600 cursor-pointer"
          >
            <svg className="h-4.5 w-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{lang === 'ar' ? 'مريض جديد' : lang === 'en' ? 'New Patient' : 'Nouveau patient'}</span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'appointments' }))}
            className="flex items-center gap-2 rounded-2xl bg-indigo-700 text-white px-4 py-2.5 text-xs font-bold shadow-md hover:bg-indigo-600 active:scale-95 dark:bg-indigo-600 cursor-pointer"
          >
            <svg className="h-4.5 w-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{lang === 'ar' ? 'موعد جديد' : lang === 'en' ? 'New Appointment' : 'Nouveau RDV'}</span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'billing' }))}
            className="flex items-center gap-2 rounded-2xl bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold shadow-md hover:bg-emerald-600 active:scale-95 dark:bg-emerald-600 cursor-pointer"
          >
            <svg className="h-4.5 w-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="12" y1="4" x2="12" y2="20" />
            </svg>
            <span>{lang === 'ar' ? 'فاتورة جديدة' : lang === 'en' ? 'New Invoice' : 'Nouvelle facture'}</span>
          </button>
        </div>

        {/* Quick Patient Search */}
        <div className="relative max-w-md">
          <input
            type="text"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder={lang === 'ar' ? 'ابحث عن مريض بالاسم أو رقم الملف...' : lang === 'en' ? 'Search patient by name or file number...' : 'Rechercher un patient par nom ou n° dossier...'}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
          {quickResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 max-h-60 overflow-y-auto">
              {quickResults.slice(0, 8).map((p) => (
                <button
                  key={p.id}
                  onClick={() => window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'patients' }))}
                  className="w-full flex items-center justify-between px-4 py-3 text-xs text-start hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-100">{p.fullName}</span>
                  <span className="text-slate-400 font-mono">#{p.fileNumber}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
              <h3 className="text-3xl font-black text-slate-850 dark:text-slate-50">
                {recpData?.stats.todayAppointments ?? 0}
              </h3>
              <p className="mt-1 text-[11px] font-bold text-amber-600">
                ● {activeTrans.statsInWaiting}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between text-slate-400">
              <svg className="h-6 w-6 stroke-current stroke-2 fill-none text-sky-500" viewBox="0 0 24 24">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
              </svg>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {lang === 'ar' ? 'الحاضرون' : lang === 'en' ? 'Checked In' : 'Présents'}
              </span>
            </div>
            <div className="mt-4 text-start">
              <h3 className="text-3xl font-black text-slate-850 dark:text-slate-50">
                {recpData?.stats.todayCheckedIn ?? 0}
              </h3>
              <p className="mt-1 text-[11px] font-bold text-emerald-600">
                ▲ {activeTrans.statsMonthlyTrend}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between text-slate-400">
              <svg className="h-6 w-6 stroke-current stroke-2 fill-none text-amber-500" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <path d="M8 14h8M8 18h5" />
              </svg>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {lang === 'ar' ? 'غرفة الانتظار' : lang === 'en' ? 'Waiting Room' : 'Salle d\'attente'}
              </span>
            </div>
            <div className="mt-4 text-start">
              <h3 className="text-3xl font-black text-slate-850 dark:text-slate-50">
                {recpData?.stats.waitingRoomCount ?? 0}
              </h3>
              <p className="mt-1 text-[11px] font-bold text-amber-600">
                ● {activeTrans.statsInWaiting}
              </p>
            </div>
          </div>

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
                {(recpData?.stats.todayRevenue ?? 0).toLocaleString()} {activeTrans.currency}
              </h3>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full w-4/5 rounded-full bg-emerald-500"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
              {lang === 'ar' ? 'مواعيد اليوم' : lang === 'en' ? "Today's Agenda" : 'Agenda du jour'}
            </h3>
            {(!recpData?.todayAgenda || recpData.todayAgenda.length === 0) ? (
              <div className="flex items-center justify-center h-40 text-xs text-slate-400">
                {lang === 'ar' ? 'لا توجد مواعيد اليوم' : lang === 'en' ? 'No appointments today' : 'Aucun rendez-vous aujourd\'hui'}
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {recpData.todayAgenda.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-xs dark:bg-slate-850">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-500">{appt.timeSlot}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{appt.patientName}</span>
                    </div>
                    <span className="text-slate-400">{appt.doctorName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
              {lang === 'ar' ? 'أحدث الفواتير' : lang === 'en' ? 'Recent Invoices' : 'Factures récentes'}
            </h3>
            {(!recpData?.recentInvoices || recpData.recentInvoices.length === 0) ? (
              <div className="flex items-center justify-center h-40 text-xs text-slate-400">
                {lang === 'ar' ? 'لا توجد فواتير حديثة' : lang === 'en' ? 'No recent invoices' : 'Aucune facture récente'}
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {recpData.recentInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-xs dark:bg-slate-850">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{inv.patientName}</span>
                      <span className="text-slate-400 ml-2">#{inv.invoiceNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{inv.totalAmount.toLocaleString()} {activeTrans.currency}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        inv.status === 'paid' ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400' :
                        inv.status === 'partial' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' :
                        'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                      }`}>
                        {inv.status === 'paid'
                          ? (lang === 'ar' ? 'مدفوعة' : lang === 'en' ? 'Paid' : 'Payée')
                          : inv.status === 'partial'
                            ? (lang === 'ar' ? 'جزئية' : lang === 'en' ? 'Partial' : 'Partielle')
                            : (lang === 'ar' ? 'غير مدفوعة' : lang === 'en' ? 'Unpaid' : 'Impayée')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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
            <h3 className="text-3xl font-black text-slate-850 dark:text-slate-50">{totalPatients.toLocaleString()}</h3>
            <p className="mt-1 text-[11px] font-bold text-emerald-600">
              ▲ {activeTrans.statsMonthlyTrend}
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
            <h3 className="text-3xl font-black text-slate-850 dark:text-slate-50">{todayVisitors}</h3>
            <p className="mt-1 text-[11px] font-bold text-amber-600">
              ● {activeTrans.statsInWaiting}
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
              {pendingLabsCount}
            </h3>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-950/20 dark:text-red-400">
              {activeTrans.statsCritical}
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

          {trends.length === 0 ? (
            <div className="flex items-center justify-center h-60 w-full text-sm text-slate-400">
              {lang === 'ar'
                ? 'بيانات الإيرادات قيد التحميل...'
                : lang === 'en'
                  ? 'Revenue data loading...'
                  : 'Chargement des données de revenus...'}
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-1 h-44">
                {trends.map((item, i) => {
                  const maxRevenue = Math.max(...trends.map(t => t.revenue), 1);
                  const heightPct = item.revenue > 0 ? Math.max((item.revenue / maxRevenue) * 100, 4) : 4;
                  const dayName = new Date(item.date).toLocaleDateString(
                    lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : 'en-US',
                    { weekday: 'short' }
                  );
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[9px] font-bold rounded-lg px-2 py-1 whitespace-nowrap z-10 dark:bg-slate-200 dark:text-slate-800">
                        {item.revenue.toLocaleString()} {activeTrans.currency}
                      </div>
                      <div
                        className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-emerald-500 to-emerald-300 hover:from-emerald-600 hover:to-emerald-400 transition-all cursor-pointer"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="mt-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500">{dayName}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs">
                <span className="font-bold text-slate-500 dark:text-slate-400">
                  {lang === 'ar' ? 'إجمالي آخر 7 أيام' : lang === 'fr' ? 'Total 7 jours' : 'Last 7 days total'}
                </span>
                <span className="font-black text-slate-800 dark:text-slate-100">
                  {trendTotal.toLocaleString()} {activeTrans.currency}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
