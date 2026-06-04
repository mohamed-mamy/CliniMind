import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { t } from '../../services/localization';
import { api, LabRequest } from '../../services/api';

export default function Laboratory() {
  const { lang, user } = useAuth();
  const [labRequests, setLabRequests] = useState<LabRequest[]>([]);

  const activeTrans = t[lang];

  const loadLabRequests = () => {
    api.getLabRequests().then((res) => {
      if (res.success) {
        setLabRequests(res.data);
      }
    });
  };

  useEffect(() => {
    loadLabRequests();
  }, []);

  const startLabAnalysis = (id: string) => {
    api.updateLabRequestStatus(id, 'in_progress').then((res) => {
      if (res.success) {
        loadLabRequests();
      }
    });
  };

  const enterLabResult = (id: string) => {
    api.updateLabRequestStatus(id, 'completed').then((res) => {
      if (res.success) {
        loadLabRequests();
      }
    });
  };

  const urgentRequests = labRequests.filter(req => req.priority === 'urgent');
  const normalRequests = labRequests.filter(req => req.priority === 'normal');

  return (
    <div className="animate-fadeIn space-y-6">
      <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{activeTrans.hospitalRequests}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent requests column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-600 dark:bg-red-950/20">
              {activeTrans.autoUpdate}
            </span>
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
            urgentRequests.map((req) => (
              <div 
                key={req.id} 
                className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-start"
              >
                <div className="flex items-start justify-between">
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700 dark:bg-red-950/20 dark:text-red-400">
                    {lang === 'ar' ? 'عاجل جداً' : 'Urgent'}
                  </span>
                  <div className="text-end">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">{req.patientName}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{req.location}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-850">
                  <span className="text-[10px] text-slate-400">{activeTrans.testType}:</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{req.testName}</span>
                </div>

                {/* Lab Technician / Director Action buttons */}
                {(user?.role === 'lab_technician' || user?.role === 'director') && (
                  <div className="mt-4 flex gap-2">
                    {req.status === 'pending' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => enterLabResult(req.id)}
                          className="flex-1 rounded-xl bg-sky-850 py-2 text-xs font-bold text-white shadow-md hover:bg-sky-700 dark:bg-sky-600 cursor-pointer"
                        >
                          {activeTrans.enterResults}
                        </button>
                        <button
                          type="button"
                          onClick={() => startLabAnalysis(req.id)}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-650 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          {activeTrans.details}
                        </button>
                      </>
                    ) : req.status === 'in_progress' ? (
                      <button
                        type="button"
                        onClick={() => enterLabResult(req.id)}
                        className="w-full rounded-xl bg-amber-500 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-600 cursor-pointer"
                      >
                        {activeTrans.enterResults}
                      </button>
                    ) : (
                      <div className="w-full text-center py-2 bg-green-50 rounded-xl text-green-700 text-xs font-bold dark:bg-green-950/20 dark:text-green-400 border border-green-150">
                        ✓ {activeTrans.testCompleted}
                      </div>
                    )}
                  </div>
                )}
                {/* Doctor view for results status */}
                {user?.role === 'doctor' && (
                  <div className="mt-4 pt-2 text-xs text-end">
                    {req.status === 'completed' ? (
                      <span className="text-green-600 font-bold">✓ تم إدخال النتيجة بنجاح</span>
                    ) : (
                      <span className="text-slate-400 italic">قيد التحليل والمراجعة...</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Routine requests column */}
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
            normalRequests.map((req) => (
              <div 
                key={req.id} 
                className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-start"
              >
                <div className="flex items-start justify-between">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-850 dark:text-slate-400">
                    {lang === 'ar' ? 'روتين' : 'Normal'}
                  </span>
                  <div className="text-end">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">{req.patientName}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{req.location}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-850">
                  <span className="text-[10px] text-slate-400">{activeTrans.testType}:</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{req.testName}</span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{req.time}</span>
                  {(user?.role === 'lab_technician' || user?.role === 'director') && (
                    <>
                      {req.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => startLabAnalysis(req.id)}
                          className="rounded-xl border border-sky-800 px-4 py-1.5 text-xs font-bold text-sky-800 hover:bg-sky-50 dark:border-sky-400 dark:text-sky-400 dark:hover:bg-slate-850 cursor-pointer"
                        >
                          {activeTrans.startTest}
                        </button>
                      ) : req.status === 'in_progress' ? (
                        <button
                          type="button"
                          onClick={() => enterLabResult(req.id)}
                          className="rounded-xl bg-sky-850 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-700 dark:bg-sky-600 cursor-pointer"
                        >
                          {activeTrans.enterResults}
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-green-600 dark:text-green-400">✓ تم الانتهاء</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
