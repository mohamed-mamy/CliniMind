import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { t } from '../../services/localization';
import { api } from '../../services/api';

function getMonthRange() {
  const now = new Date();
  const from = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const to = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function Reports() {
  const { lang, user } = useAuth();
  const activeTrans = t[lang];
  const isDirector = user?.role === 'director';

  const [fromDate, setFromDate] = useState(getMonthRange().from.slice(0, 10));
  const [toDate, setToDate] = useState(getMonthRange().to.slice(0, 10));
  const [financial, setFinancial] = useState<any>(null);
  const [medical, setMedical] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'financial' | 'medical'>('financial');

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = new Date(fromDate).toISOString();
      const to = new Date(toDate + 'T23:59:59.999Z').toISOString();
      const [finRes, medRes] = await Promise.all([
        api.getFinancialReport({ from, to }),
        api.getMedicalReport({ from, to }),
      ]);
      if (finRes.success) setFinancial(finRes.data);
      else setError(finRes.error || 'Failed');
      if (medRes.success) setMedical(medRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

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
            ? 'هذه الصفحة مخصصة لمدير العيادة فقط.'
            : 'This page is restricted to the clinic director.'}
        </p>
      </div>
    );
  }

  const formatCurrency = (n: number) => n.toLocaleString() + ' ' + activeTrans.currency;

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{activeTrans.tabReports}</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400">{lang === 'ar' ? 'من' : 'From'}</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400">{lang === 'ar' ? 'إلى' : 'To'}</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            />
          </div>
          <button
            onClick={loadReports}
            className="rounded-xl bg-sky-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-700 dark:bg-sky-600 cursor-pointer"
          >
            {lang === 'ar' ? 'تحديث' : lang === 'fr' ? 'Actualiser' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('financial')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'financial'
              ? 'bg-white text-sky-800 shadow-sm dark:bg-slate-900 dark:text-sky-400'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {lang === 'ar' ? 'التقرير المالي' : lang === 'fr' ? 'Rapport financier' : 'Financial Report'}
        </button>
        <button
          onClick={() => setActiveTab('medical')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'medical'
              ? 'bg-white text-sky-800 shadow-sm dark:bg-slate-900 dark:text-sky-400'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {lang === 'ar' ? 'التقرير الطبي' : lang === 'fr' ? 'Rapport médical' : 'Medical Report'}
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/20">
          <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
          <button onClick={loadReports} className="mt-3 rounded-xl bg-red-100 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-400 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Financial Report */}
      {!loading && !error && activeTab === 'financial' && financial && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/30 p-5 dark:border-emerald-900 dark:bg-emerald-950/10">
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                {lang === 'ar' ? 'الإيرادات' : lang === 'fr' ? 'Revenus' : 'Revenue'}
              </p>
              <p className="mt-2 text-2xl font-black text-emerald-800 dark:text-emerald-300">{formatCurrency(financial.totalRevenue)}</p>
            </div>
            <div className="rounded-3xl border border-red-100 bg-red-50/30 p-5 dark:border-red-900 dark:bg-red-950/10">
              <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
                {lang === 'ar' ? 'المصروفات' : lang === 'fr' ? 'Dépenses' : 'Expenses'}
              </p>
              <p className="mt-2 text-2xl font-black text-red-800 dark:text-red-300">{formatCurrency(financial.totalExpenses)}</p>
            </div>
            <div className="rounded-3xl border border-sky-100 bg-sky-50/30 p-5 dark:border-sky-900 dark:bg-sky-950/10">
              <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wide">
                {lang === 'ar' ? 'صافي الربح' : lang === 'fr' ? 'Bénéfice net' : 'Net Profit'}
              </p>
              <p className={`mt-2 text-2xl font-black ${financial.netProfit >= 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}`}>
                {formatCurrency(financial.netProfit)}
              </p>
            </div>
            <div className="rounded-3xl border border-amber-100 bg-amber-50/30 p-5 dark:border-amber-900 dark:bg-amber-950/10">
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                {lang === 'ar' ? 'الديون' : lang === 'fr' ? 'Impayés' : 'Unpaid'}
              </p>
              <p className="mt-2 text-2xl font-black text-amber-800 dark:text-amber-300">{formatCurrency(financial.unpaidInvoices)}</p>
            </div>
          </div>

          {/* Revenue by Category */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-300">
              {lang === 'ar' ? 'الإيرادات حسب الفئة' : lang === 'fr' ? 'Revenus par catégorie' : 'Revenue by Category'}
            </h3>
            <div className="space-y-3">
              {Object.entries(financial.byCategory).length === 0 ? (
                <p className="text-xs text-slate-400 italic">—</p>
              ) : (
                Object.entries(financial.byCategory).map(([cat, total]: [string, any]) => {
                  const maxVal = Math.max(...Object.values(financial.byCategory) as number[], 1);
                  const pct = (total / maxVal) * 100;
                  const catLabel = cat === 'consultation'
                    ? (lang === 'ar' ? 'استشارات' : lang === 'fr' ? 'Consultations' : 'Consultations')
                    : (lang === 'ar' ? 'تحاليل' : lang === 'fr' ? 'Analyses' : 'Lab Tests');
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-slate-600 dark:text-slate-400">{catLabel}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(total)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Expenses by Category */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-300">
              {lang === 'ar' ? 'المصروفات حسب الفئة' : lang === 'fr' ? 'Dépenses par catégorie' : 'Expenses by Category'}
            </h3>
            <div className="space-y-3">
              {Object.entries(financial.expensesByCategory).length === 0 ? (
                <p className="text-xs text-slate-400 italic">—</p>
              ) : (
                Object.entries(financial.expensesByCategory).map(([cat, total]: [string, any]) => {
                  const maxVal = Math.max(...Object.values(financial.expensesByCategory) as number[], 1);
                  const pct = (total / maxVal) * 100;
                  const catLabels: Record<string, string> = {
                    salary: lang === 'ar' ? 'رواتب' : lang === 'fr' ? 'Salaires' : 'Salary',
                    rent: lang === 'ar' ? 'إيجار' : lang === 'fr' ? 'Loyer' : 'Rent',
                    utilities: lang === 'ar' ? 'خدمات' : lang === 'fr' ? 'Services' : 'Utilities',
                    supplies: lang === 'ar' ? 'لوازم' : lang === 'fr' ? 'Fournitures' : 'Supplies',
                    maintenance: lang === 'ar' ? 'صيانة' : lang === 'fr' ? 'Maintenance' : 'Maintenance',
                    other: lang === 'ar' ? 'أخرى' : lang === 'fr' ? 'Autres' : 'Other',
                  };
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-slate-600 dark:text-slate-400">{catLabels[cat] || cat}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(total)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-red-400 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Medical Report */}
      {!loading && !error && activeTab === 'medical' && medical && (
        <div className="space-y-6">
          {/* Appointments Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                {lang === 'ar' ? 'إجمالي المواعيد' : lang === 'fr' ? 'Total rendez-vous' : 'Total Appointments'}
              </p>
              <p className="mt-2 text-2xl font-black text-slate-800 dark:text-slate-100">{medical.totalAppointments}</p>
            </div>
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/30 p-5 dark:border-emerald-900 dark:bg-emerald-950/10">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                {lang === 'ar' ? 'مكتملة' : lang === 'fr' ? 'Terminés' : 'Completed'}
              </p>
              <p className="mt-2 text-2xl font-black text-emerald-800 dark:text-emerald-300">{medical.completedAppointments}</p>
            </div>
            <div className="rounded-3xl border border-red-100 bg-red-50/30 p-5 dark:border-red-900 dark:bg-red-950/10">
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide">
                {lang === 'ar' ? 'ملغية' : lang === 'fr' ? 'Annulés' : 'Cancelled'}
              </p>
              <p className="mt-2 text-2xl font-black text-red-800 dark:text-red-300">{medical.cancelledAppointments}</p>
            </div>
            <div className="rounded-3xl border border-amber-100 bg-amber-50/30 p-5 dark:border-amber-900 dark:bg-amber-950/10">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">
                {lang === 'ar' ? 'نسبة الغياب' : lang === 'fr' ? 'Taux d\'absence' : 'No-Show Rate'}
              </p>
              <p className="mt-2 text-2xl font-black text-amber-800 dark:text-amber-300">{medical.noShowRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Lab Stats */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-300">
              {lang === 'ar' ? 'إحصائيات المختبر' : lang === 'fr' ? 'Statistiques du laboratoire' : 'Lab Statistics'}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{medical.labRequests.total}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-1">
                  {lang === 'ar' ? 'إجمالي' : lang === 'fr' ? 'Total' : 'Total'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-emerald-600">{medical.labRequests.completed}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-1">
                  {lang === 'ar' ? 'مكتمل' : lang === 'fr' ? 'Terminé' : 'Completed'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-red-500">{medical.labRequests.criticalResults}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-1">
                  {lang === 'ar' ? 'حرجة' : lang === 'fr' ? 'Critiques' : 'Critical'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}