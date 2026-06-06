import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { t } from '../../services/localization';
import { api, LabRequest, LabResult, Patient } from '../../services/api';

export default function Laboratory() {
  const { lang, user } = useAuth();
  const [labRequests, setLabRequests] = useState<LabRequest[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);

  // Create form state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [testsInput, setTestsInput] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');

  // Results form state
  const [resultEntries, setResultEntries] = useState<Record<string, { resultText: string; resultNumeric: string; unit: string; normalRange: string }>>({});
  const [submitting, setSubmitting] = useState(false);

  const activeTrans = t[lang];
  const canCreate = user?.role === 'doctor' || user?.role === 'director';

  const loadLabRequests = () => {
    api.getLabRequests().then((res) => {
      if (res.success) setLabRequests(res.data);
    });
  };

  useEffect(() => { loadLabRequests(); }, []);

  useEffect(() => {
    if (showCreateModal) {
      api.getPatients().then(res => {
        if (res.success) setPatients(res.data);
      });
    }
  }, [showCreateModal]);

  const handleCreateRequest = () => {
    const tests = testsInput.split('\n').map(t => t.trim()).filter(Boolean);
    if (!selectedPatientId || tests.length === 0) return;
    api.createLabRequest({ patientId: selectedPatientId, tests, priority }).then(res => {
      if (res.success) {
        loadLabRequests();
        setShowCreateModal(false);
        setSelectedPatientId('');
        setTestsInput('');
        setPriority('normal');
      }
    });
  };

  const handleStartAnalysis = (id: string) => {
    api.updateLabRequestStatus(id, 'in_progress').then(res => {
      if (res.success) loadLabRequests();
    });
  };

  const openResultsModal = (req: LabRequest) => {
    setSelectedRequest(req);
    const entries: Record<string, any> = {};
    req.tests.forEach(test => {
      const existing = req.results?.find(r => r.testName === test);
      entries[test] = {
        resultText: existing?.resultText || '',
        resultNumeric: existing?.resultNumeric?.toString() || '',
        unit: existing?.unit || '',
        normalRange: existing?.normalRange || '',
      };
    });
    setResultEntries(entries);
    setShowResultsModal(true);
  };

  const openDetailModal = (req: LabRequest) => {
    setSelectedRequest(req);
    setShowDetailModal(true);
  };

  const handleSubmitResults = () => {
    if (!selectedRequest) return;
    setSubmitting(true);
    const results: LabResult[] = selectedRequest.tests.map(test => {
      const entry = resultEntries[test];
      return {
        testName: test,
        resultText: entry?.resultText || undefined,
        resultNumeric: entry?.resultNumeric ? parseFloat(entry.resultNumeric) : undefined,
        unit: entry?.unit || undefined,
        normalRange: entry?.normalRange || undefined,
      };
    });
    api.enterLabResults(selectedRequest.id, results).then(res => {
      if (res.success) {
        loadLabRequests();
        setShowResultsModal(false);
        setSelectedRequest(null);
      }
    }).finally(() => setSubmitting(false));
  };

  const urgentRequests = labRequests.filter(req => req.priority === 'urgent');
  const normalRequests = labRequests.filter(req => req.priority === 'normal');

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{activeTrans.hospitalRequests}</h2>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-sky-800 text-white px-4 py-2.5 text-xs font-bold shadow-md hover:bg-sky-700 active:scale-95 dark:bg-sky-600 cursor-pointer"
          >
            <svg className="h-4.5 w-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{lang === 'ar' ? 'طلب تحليل جديد' : 'New Lab Request'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-600 dark:bg-red-950/20">{activeTrans.autoUpdate}</span>
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-red-600">
              {activeTrans.urgentCases}
              <span className="h-2 w-2 rounded-full bg-red-500"></span>
            </h3>
          </div>
          {urgentRequests.length === 0 ? (
            <div className="py-12 bg-white rounded-3xl border border-dashed text-center text-xs text-slate-400 dark:bg-slate-900 dark:border-slate-850">
              {lang === 'ar' ? 'لا توجد طلبات عاجلة حالياً' : 'No urgent requests currently'}
            </div>
          ) : (
            urgentRequests.map(req => (
              <LabRequestCard
                key={req.id}
                req={req}
                userRole={user?.role}
                activeTrans={activeTrans}
                lang={lang}
                onStart={handleStartAnalysis}
                onEnterResults={openResultsModal}
                onViewDetails={openDetailModal}
              />
            ))
          )}
        </div>

        {/* Normal Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
            <span className="text-[10px] text-slate-400">{activeTrans.autoUpdate}</span>
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-sky-850 dark:text-sky-400">
              {activeTrans.routineRequests}
              <span className="h-2 w-2 rounded-full bg-sky-500"></span>
            </h3>
          </div>
          {normalRequests.length === 0 ? (
            <div className="py-12 bg-white rounded-3xl border border-dashed text-center text-xs text-slate-400 dark:bg-slate-900 dark:border-slate-850">
              {lang === 'ar' ? 'لا توجد طلبات روتينية حالياً' : 'No routine requests currently'}
            </div>
          ) : (
            normalRequests.map(req => (
              <LabRequestCard
                key={req.id}
                req={req}
                userRole={user?.role}
                activeTrans={activeTrans}
                lang={lang}
                onStart={handleStartAnalysis}
                onEnterResults={openResultsModal}
                onViewDetails={openDetailModal}
              />
            ))
          )}
        </div>
      </div>

      {/* Create Lab Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 animate-fadeIn my-8 text-start">
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => setShowCreateModal(false)} className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 cursor-pointer">
                <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
              <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">
                {lang === 'ar' ? 'طلب تحليل جديد' : 'New Lab Request'}
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'المريض' : 'Patient'}</label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none dark:border-slate-850 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="">{lang === 'ar' ? 'اختر المريض...' : 'Select patient...'}</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName} (#{p.fileNumber})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'التحاليل المطلوبة' : 'Required Tests'}</label>
                <textarea
                  value={testsInput}
                  onChange={e => setTestsInput(e.target.value)}
                  placeholder={lang === 'ar' ? 'أدخل اسم كل تحليل في سطر جديد' : 'Enter each test on a new line'}
                  rows={4}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-850 outline-none focus:border-sky-500 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'الأولوية' : 'Priority'}</label>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => setPriority('normal')}
                    className={`flex-1 rounded-xl py-2 text-center text-xs font-bold transition-all cursor-pointer ${priority === 'normal' ? 'bg-sky-100 text-sky-700 ring-2 ring-sky-300 dark:bg-sky-950/40 dark:text-sky-400' : 'bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-850'}`}
                  >
                    {lang === 'ar' ? 'عادي' : 'Normal'}
                  </button>
                  <button
                    onClick={() => setPriority('urgent')}
                    className={`flex-1 rounded-xl py-2 text-center text-xs font-bold transition-all cursor-pointer ${priority === 'urgent' ? 'bg-red-100 text-red-700 ring-2 ring-red-300 dark:bg-red-950/40 dark:text-red-400' : 'bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-850'}`}
                  >
                    {lang === 'ar' ? 'عاجل' : 'Urgent'}
                  </button>
                </div>
              </div>
              <button
                onClick={handleCreateRequest}
                disabled={!selectedPatientId || !testsInput.trim()}
                className="w-full rounded-2xl bg-sky-800 py-3.5 text-xs font-bold text-white shadow-md hover:bg-sky-700 disabled:opacity-50 dark:bg-sky-600 cursor-pointer disabled:cursor-not-allowed"
              >
                {lang === 'ar' ? 'إرسال الطلب' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enter Results Modal */}
      {showResultsModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 animate-fadeIn my-8 text-start">
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => { setShowResultsModal(false); setSelectedRequest(null); }} className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 cursor-pointer">
                <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
              <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">
                {lang === 'ar' ? 'إدخال نتائج التحاليل' : 'Enter Lab Results'} — {selectedRequest.patientName}
              </h3>
            </div>
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
              {selectedRequest.tests.map((test, idx) => {
                const entry = resultEntries[test] || { resultText: '', resultNumeric: '', unit: '', normalRange: '' };
                return (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-3">{test}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'النتيجة (نص)' : 'Result (Text)'}</label>
                        <input
                          type="text" value={entry.resultText}
                          onChange={e => setResultEntries(prev => ({ ...prev, [test]: { ...prev[test], resultText: e.target.value } }))}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'النتيجة (رقم)' : 'Result (Numeric)'}</label>
                        <input
                          type="number" step="any" value={entry.resultNumeric}
                          onChange={e => setResultEntries(prev => ({ ...prev, [test]: { ...prev[test], resultNumeric: e.target.value } }))}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'الوحدة' : 'Unit'}</label>
                        <input
                          type="text" value={entry.unit}
                          onChange={e => setResultEntries(prev => ({ ...prev, [test]: { ...prev[test], unit: e.target.value } }))}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'المدى الطبيعي' : 'Normal Range'}</label>
                        <input
                          type="text" value={entry.normalRange}
                          onChange={e => setResultEntries(prev => ({ ...prev, [test]: { ...prev[test], normalRange: e.target.value } }))}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={handleSubmitResults}
              disabled={submitting}
              className="mt-5 w-full rounded-2xl bg-sky-800 py-3.5 text-xs font-bold text-white shadow-md hover:bg-sky-700 disabled:opacity-50 dark:bg-sky-600 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ النتائج وإرسال الإشعار' : 'Save Results & Notify Doctor')}
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 animate-fadeIn my-8 text-start">
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => { setShowDetailModal(false); setSelectedRequest(null); }} className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 cursor-pointer">
                <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
              <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">
                {lang === 'ar' ? 'تفاصيل طلب التحليل' : 'Request Details'}
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-xs"><span className="text-slate-400">{lang === 'ar' ? 'المريض' : 'Patient'}</span><span className="font-bold">{selectedRequest.patientName}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-400">{lang === 'ar' ? 'الحالة' : 'Status'}</span>
                <span className={`font-bold ${selectedRequest.status === 'completed' ? 'text-green-600' : selectedRequest.status === 'in_progress' ? 'text-amber-600' : 'text-slate-600'}`}>
                  {selectedRequest.status === 'pending' ? (lang === 'ar' ? 'قيد الانتظار' : 'Pending') : selectedRequest.status === 'in_progress' ? (lang === 'ar' ? 'قيد التحليل' : 'In Progress') : (lang === 'ar' ? 'مكتمل' : 'Completed')}
                </span>
              </div>
              {selectedRequest.isCritical && (
                <div className="bg-red-50 text-red-700 rounded-xl p-3 text-xs font-bold text-center dark:bg-red-950/20 dark:text-red-400">
                  {lang === 'ar' ? 'نتائج حرجة - تم إشعار الطبيب' : 'Critical Results - Doctor Notified'}
                </div>
              )}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">{lang === 'ar' ? 'النتائج' : 'Results'}</h4>
                {selectedRequest.results.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">{lang === 'ar' ? 'لم يتم إدخال النتائج بعد' : 'Results not entered yet'}</p>
                ) : (
                  <div className="space-y-2">
                    {selectedRequest.results.map((r, i) => (
                      <div key={i} className="bg-slate-50 dark:bg-slate-850 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-100">{r.testName}</div>
                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                          {r.resultText && <span>{r.resultText} </span>}
                          {r.resultNumeric !== undefined && <span className="font-bold">{r.resultNumeric} {r.unit || ''}</span>}
                          {r.normalRange && <span className="text-slate-400"> ({lang === 'ar' ? 'الطبيعي' : 'normal'}: {r.normalRange})</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {user?.role === 'doctor' && selectedRequest.status !== 'completed' && (
                <p className="text-xs text-slate-400 italic text-center">{lang === 'ar' ? 'قيد التحليل والمراجعة...' : 'Under analysis...'}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LabRequestCard({ req, userRole, activeTrans, lang, onStart, onEnterResults, onViewDetails }: {
  req: LabRequest;
  userRole?: string;
  activeTrans: any;
  lang: string;
  onStart: (id: string) => void;
  onEnterResults: (req: LabRequest) => void;
  onViewDetails: (req: LabRequest) => void;
}) {
  const isTech = userRole === 'lab_technician' || userRole === 'director';
  const isUrgent = req.priority === 'urgent';

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-start">
      <div className="flex items-start justify-between">
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${isUrgent ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-850 dark:text-slate-400'}`}>
          {isUrgent ? (lang === 'ar' ? 'عاجل' : 'Urgent') : (lang === 'ar' ? 'روتين' : 'Normal')}
        </span>
        <div className="text-end">
          <h4 className="font-bold text-slate-800 dark:text-slate-100">{req.patientName}</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">{req.tests.join(', ')}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-850">
        <span className="text-[10px] text-slate-400">{activeTrans.testType}:</span>
        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{req.tests[0]}{req.tests.length > 1 ? '...' : ''}</span>
      </div>

      {isTech && (
        <div className="mt-4 flex gap-2">
          {req.status === 'pending' ? (
            <>
              <button onClick={() => onEnterResults(req)} className="flex-1 rounded-xl bg-sky-850 py-2 text-xs font-bold text-white shadow-md hover:bg-sky-700 dark:bg-sky-600 cursor-pointer">
                {activeTrans.enterResults}
              </button>
              <button onClick={() => onStart(req.id)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-650 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer">
                {activeTrans.startTest}
              </button>
            </>
          ) : req.status === 'in_progress' ? (
            <button onClick={() => onEnterResults(req)} className="w-full rounded-xl bg-amber-500 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-600 cursor-pointer">
              {lang === 'ar' ? 'إكمال النتائج' : 'Complete Results'}
            </button>
          ) : (
            <button onClick={() => onViewDetails(req)} className="w-full rounded-xl bg-green-50 py-2 text-xs font-bold text-green-700 hover:bg-green-100 dark:bg-green-950/20 dark:text-green-400 border border-green-150 cursor-pointer">
              ✓ {activeTrans.testCompleted}
            </button>
          )}
        </div>
      )}

      {userRole === 'doctor' && (
        <div className="mt-4 flex gap-2">
          <button onClick={() => onViewDetails(req)} className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-650 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer">
            {lang === 'ar' ? 'عرض التفاصيل' : 'View Details'}
          </button>
          {req.status === 'completed' ? (
            <span className="text-green-600 font-bold text-xs flex items-center">✓ {lang === 'ar' ? 'اكتمل' : 'Done'}</span>
          ) : (
            <span className="text-slate-400 italic text-xs flex items-center">{lang === 'ar' ? 'قيد التحليل...' : 'In progress...'}</span>
          )}
        </div>
      )}
    </div>
  );
}