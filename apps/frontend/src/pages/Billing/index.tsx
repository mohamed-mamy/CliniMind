import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { t } from '../../services/localization';
import { api, Invoice } from '../../services/api';

export default function Billing() {
  const { lang, user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState<Invoice | null>(null);

  // Form states (Create invoice)
  const [patientName, setPatientName] = useState('');
  const [totalAmount, setTotalAmount] = useState(150);
  const [paidAmount, setPaidAmount] = useState(0);

  // Form states (Record payment)
  const [paymentInput, setPaymentInput] = useState(0);

  const activeTrans = t[lang];

  const loadInvoices = () => {
    api.getInvoices().then((res) => {
      if (res.success) {
        setInvoices(res.data);
      }
    });
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    api.createInvoice({
      patientName,
      totalAmount,
      paidAmount,
      createdAt: new Date().toISOString().split('T')[0],
    }).then((res) => {
      if (res.success) {
        loadInvoices();
        setPatientName('');
        setTotalAmount(150);
        setPaidAmount(0);
        setShowCreateModal(false);
      }
    });
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal) return;

    // Simulate updating paid amount
    const updatedInvoices = invoices.map((inv) => {
      if (inv.id === showPayModal.id) {
        const nextPaid = inv.paidAmount + paymentInput;
        const nextRemaining = Math.max(0, inv.totalAmount - nextPaid);
        const status = (nextPaid >= inv.totalAmount ? 'paid' : nextPaid > 0 ? 'partial' : 'unpaid') as Invoice['status'];
        return {
          ...inv,
          paidAmount: nextPaid,
          remainingAmount: nextRemaining,
          status,
        };
      }
      return inv;
    });

    setInvoices(updatedInvoices);
    setPaymentInput(0);
    setShowPayModal(null);
  };

  const filteredInvoices = invoices.filter(
    (inv) => inv.patientName.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        {(user?.role === 'receptionist' || user?.role === 'director') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-sky-800 text-white px-4 py-2.5 text-xs font-bold shadow-md hover:bg-sky-700 active:scale-95 dark:bg-sky-600 dark:hover:bg-sky-500 cursor-pointer"
          >
            <svg className="h-4.5 w-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{lang === 'ar' ? 'إنشاء فاتورة' : 'New Invoice'}</span>
          </button>
        )}
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{activeTrans.tabBilling}</h2>
      </div>

      {/* Invoice filter search */}
      <div className="relative max-w-md text-start">
        <input
          type="text"
          placeholder={lang === 'ar' ? 'البحث باسم المريض...' : 'Search by patient name...'}
          value={invoiceSearch}
          onChange={(e) => setInvoiceSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      {/* Invoices table layout */}
      <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-450 dark:bg-slate-850 dark:border-slate-800">
                <th className="p-4 text-start">{lang === 'ar' ? 'رقم الفاتورة' : 'Invoice ID'}</th>
                <th className="p-4 text-start">{lang === 'ar' ? 'اسم المريض' : 'Patient Name'}</th>
                <th className="p-4 text-start">{lang === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</th>
                <th className="p-4 text-start">{lang === 'ar' ? 'المبلغ الكلي' : 'Total'}</th>
                <th className="p-4 text-start">{lang === 'ar' ? 'المبلغ المدفوع' : 'Paid'}</th>
                <th className="p-4 text-start">{lang === 'ar' ? 'المبلغ المتبقي' : 'Remaining'}</th>
                <th className="p-4 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="p-4 text-center">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-slate-400 italic">
                    {lang === 'ar' ? 'لا توجد فواتير مطابقة' : 'No invoices matched'}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const statusLabel: Record<Invoice['status'], string> = {
                    paid: lang === 'ar' ? 'مدفوعة' : 'Paid',
                    unpaid: lang === 'ar' ? 'غير مدفوعة' : 'Unpaid',
                    partial: lang === 'ar' ? 'مدفوعة جزئياً' : 'Partial',
                  };
                  const statusColors: Record<Invoice['status'], string> = {
                    paid: 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400',
                    unpaid: 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400',
                    partial: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400',
                  };

                  return (
                    <tr key={inv.id} className="text-xs hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-100 text-start">{inv.invoiceNumber}</td>
                      <td className="p-4 font-bold text-start">{inv.patientName}</td>
                      <td className="p-4 text-slate-500 text-start">{inv.createdAt}</td>
                      <td className="p-4 font-bold text-start">{inv.totalAmount} {activeTrans.currency}</td>
                      <td className="p-4 text-green-600 font-bold text-start">{inv.paidAmount} {activeTrans.currency}</td>
                      <td className="p-4 text-red-500 font-bold text-start">{inv.remainingAmount} {activeTrans.currency}</td>
                      <td className="p-4 text-start">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusColors[inv.status]}`}>
                          {statusLabel[inv.status]}
                        </span>
                      </td>
                      <td className="p-4 flex items-center justify-center gap-2">
                        {inv.remainingAmount > 0 && (user?.role === 'receptionist' || user?.role === 'director') && (
                          <button
                            onClick={() => {
                              setShowPayModal(inv);
                              setPaymentInput(inv.remainingAmount);
                            }}
                            className="bg-sky-50 text-sky-850 border border-sky-200 dark:bg-sky-950/40 dark:border-sky-900/60 rounded-xl px-3 py-1 font-bold hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            {lang === 'ar' ? 'تسجيل دفعة' : 'Record Payment'}
                          </button>
                        )}
                        <button
                          onClick={() => alert(lang === 'ar' ? 'تحميل الفاتورة PDF...' : 'Downloading PDF Invoice...')}
                          className="bg-slate-50 text-slate-650 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl px-3 py-1 font-bold hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          {lang === 'ar' ? 'تصدير PDF' : 'Export PDF'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL: CREATE INVOICE */}
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
                {lang === 'ar' ? 'إنشاء فاتورة جديدة' : 'Create New Invoice'}
              </h3>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'اسم المريض' : 'Patient Name'}</label>
                <input
                  type="text"
                  required
                  placeholder="أدخل اسم المريض..."
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'المبلغ الكلي' : 'Total Amount'}</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'المبلغ المدفوع' : 'Paid Amount'}</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={totalAmount}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-sky-800 py-3.5 text-xs font-bold text-white shadow-md hover:bg-sky-700 dark:bg-sky-600 cursor-pointer"
                >
                  {lang === 'ar' ? 'حفظ الفاتورة' : 'Save Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: RECORD PAYMENT */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 animate-fadeIn text-start">
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setShowPayModal(null)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
              >
                <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">
                {lang === 'ar' ? 'تسجيل دفعة للفاتورة' : 'Record Invoice Payment'}
              </h3>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-450">{lang === 'ar' ? 'اسم المريض' : 'Patient'}:</span>
                  <span className="font-bold">{showPayModal.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">{lang === 'ar' ? 'المبلغ الكلي' : 'Total'}:</span>
                  <span className="font-bold">{showPayModal.totalAmount} {activeTrans.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">{lang === 'ar' ? 'المبلغ المتبقي' : 'Remaining'}:</span>
                  <span className="font-bold text-red-500">{showPayModal.remainingAmount} {activeTrans.currency}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'مبلغ الدفعة' : 'Payment Amount'}</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={showPayModal.remainingAmount}
                  value={paymentInput}
                  onChange={(e) => setPaymentInput(Number(e.target.value))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-sky-800 py-3.5 text-xs font-bold text-white shadow-md hover:bg-sky-700 dark:bg-sky-600 cursor-pointer"
                >
                  {lang === 'ar' ? 'تأكيد الدفع' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
