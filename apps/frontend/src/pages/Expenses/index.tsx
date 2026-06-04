import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { t } from '../../services/localization';
import { api, Expense } from '../../services/api';

export default function Expenses() {
  const { lang, user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form states
  const [category, setCategory] = useState<Expense['category']>('supplies');
  const [amount, setAmount] = useState(100);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const activeTrans = t[lang];
  const isDirector = user?.role === 'director';

  const loadExpenses = () => {
    api.getExpenses().then((res) => {
      if (res.success) {
        setExpenses(res.data);
      }
    });
  };

  useEffect(() => {
    if (isDirector) {
      loadExpenses();
    }
  }, [isDirector]);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    api.createExpense({
      category,
      amount,
      description,
      date,
    }).then((res) => {
      if (res.success) {
        loadExpenses();
        setDescription('');
        setAmount(100);
        setShowCreateModal(false);
      }
    });
  };

  const handleDeleteExpense = (id: string) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه المصاريف؟' : 'Are you sure you want to delete this expense?')) return;
    
    api.deleteExpense(id).then((res) => {
      if (res.success) {
        loadExpenses();
      }
    });
  };

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
            ? 'عذراً، هذه الصفحة مخصصة لمدير العيادة فقط ولا يمكن تصفحها بواسطة أدوار أخرى.' 
            : 'Sorry, this page is restricted to the clinic director and cannot be viewed by other roles.'}
        </p>
      </div>
    );
  }

  const categoryLabels: Record<Expense['category'], string> = {
    salary: lang === 'ar' ? 'الرواتب والأجور' : 'Salaries',
    rent: lang === 'ar' ? 'الإيجار' : 'Rent',
    utilities: lang === 'ar' ? 'الخدمات العامة' : 'Utilities',
    supplies: lang === 'ar' ? 'المستلزمات والمواد' : 'Supplies',
    maintenance: lang === 'ar' ? 'الصيانة والترميم' : 'Maintenance',
    other: lang === 'ar' ? 'مصاريف أخرى' : 'Other',
  };

  const filteredExpenses = filterCategory === 'all' 
    ? expenses 
    : expenses.filter(e => e.category === filterCategory);

  const totalSum = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-2xl bg-sky-850 text-white px-4 py-2.5 text-xs font-bold shadow-md hover:bg-sky-700 active:scale-95 dark:bg-sky-600 dark:hover:bg-sky-500 cursor-pointer"
        >
          <svg className="h-4.5 w-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>{lang === 'ar' ? 'تسجيل مصروف' : 'Log Expense'}</span>
        </button>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{activeTrans.tabExpenses}</h2>
      </div>

      {/* Overview Cards & Filter toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Total stats card */}
        <div className="rounded-2xl bg-slate-900 text-white p-4 flex items-center gap-4 text-start shadow-md w-full md:max-w-xs dark:bg-slate-900 border border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
            <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="12" y1="4" x2="12" y2="20" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'إجمالي المصاريف المصنفة' : 'Total Filtered Expenses'}</span>
            <span className="text-lg font-black">{totalSum.toLocaleString()} {activeTrans.currency}</span>
          </div>
        </div>

        {/* Categories filters */}
        <div className="flex flex-wrap gap-2 text-start">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              filterCategory === 'all'
                ? 'bg-sky-850 text-white border-sky-850 dark:bg-sky-600 dark:border-sky-600'
                : 'bg-white border-slate-200 text-slate-650 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350 hover:bg-slate-50'
            }`}
          >
            {lang === 'ar' ? 'الكل' : 'All'}
          </button>
          {Object.entries(categoryLabels).map(([catKey, label]) => (
            <button
              key={catKey}
              onClick={() => setFilterCategory(catKey)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                filterCategory === catKey
                  ? 'bg-sky-850 text-white border-sky-850 dark:bg-sky-600 dark:border-sky-600'
                  : 'bg-white border-slate-200 text-slate-650 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-450 dark:bg-slate-850 dark:border-slate-800">
                <th className="p-4 text-start">{lang === 'ar' ? 'التصنيف' : 'Category'}</th>
                <th className="p-4 text-start">{lang === 'ar' ? 'التفاصيل / البيان' : 'Description'}</th>
                <th className="p-4 text-start">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th className="p-4 text-start">{lang === 'ar' ? 'القيمة' : 'Amount'}</th>
                <th className="p-4 text-center">{lang === 'ar' ? 'حذف' : 'Delete'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-slate-400 italic">
                    {lang === 'ar' ? 'لا توجد مصاريف مسجلة حالياً' : 'No logged expenses'}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="text-xs hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                    <td className="p-4 text-start">
                      <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-1 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {categoryLabels[exp.category]}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200 text-start">{exp.description}</td>
                    <td className="p-4 text-slate-500 text-start">{exp.date}</td>
                    <td className="p-4 font-black text-red-500 text-start">{exp.amount} {activeTrans.currency}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="text-red-500 hover:text-red-700 hover:scale-105 active:scale-95 transition-all p-1.5 cursor-pointer"
                      >
                        <svg className="h-4.5 w-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL: CREATE EXPENSE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 animate-fadeIn text-start">
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
              >
                <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">
                {lang === 'ar' ? 'سجل بند مصروفات جديد' : 'Log New Expense Item'}
              </h3>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'تصنيف المصروف' : 'Expense Category'}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Expense['category'])}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'المبلغ الكلي' : 'Amount'}</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'التاريخ' : 'Date'}</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'التفاصيل والبيان' : 'Description'}</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: دفع رواتب عمال النظافة والصيانة..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-sky-800 py-3.5 text-xs font-bold text-white shadow-md hover:bg-sky-700 dark:bg-sky-600 cursor-pointer"
                >
                  {lang === 'ar' ? 'تسجيل المصروف' : 'Submit Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
