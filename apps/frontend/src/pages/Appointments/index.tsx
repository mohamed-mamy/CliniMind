import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { t } from '../../services/localization';
import { api, Appointment } from '../../services/api';

export default function Appointments() {
  const { lang, user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [scheduleActiveDay, setScheduleActiveDay] = useState(16);

  const activeTrans = t[lang];

  const loadAppointments = () => {
    api.getAppointments().then((res) => {
      if (res.success) {
        setAppointments(res.data);
      }
    });
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const cycleAppointmentStatus = (id: string) => {
    const appt = appointments.find(a => a.id === id);
    if (!appt) return;

    const statusCycle: Appointment['status'][] = ['scheduled', 'confirmed', 'completed', 'cancelled'];
    const currentIndex = statusCycle.indexOf(appt.status);
    const nextIndex = (currentIndex + 1) % statusCycle.length;
    const nextStatus = statusCycle[nextIndex];

    api.updateAppointmentStatus(id, nextStatus).then((res) => {
      if (res.success) {
        loadAppointments();
      }
    });
  };

  // Group appointments by doctor
  const doctors = ['د. أحمد يوسف', 'د. سارة محمود'];

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-sm dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{activeTrans.october2023}</span>
          <svg className="h-4.5 w-4.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{activeTrans.tabSchedule}</h2>
      </div>

      {/* Horizontal date selector */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 max-w-xl text-start">
        {[15, 16, 17, 18, 19].map((dayNum) => {
          const dayNames: Record<number, string> = {
            15: lang === 'ar' ? 'الأحد' : lang === 'en' ? 'Sun' : 'Dim',
            16: lang === 'ar' ? 'الإثنين' : lang === 'en' ? 'Mon' : 'Lun',
            17: lang === 'ar' ? 'الثلاثاء' : lang === 'en' ? 'Tue' : 'Mar',
            18: lang === 'ar' ? 'الأربعاء' : lang === 'en' ? 'Wed' : 'Mer',
            19: lang === 'ar' ? 'الخميس' : lang === 'en' ? 'Thu' : 'Jeu',
          };
          const isActive = scheduleActiveDay === dayNum;
          return (
            <button
              key={dayNum}
              onClick={() => setScheduleActiveDay(dayNum)}
              className={`flex flex-col items-center justify-center min-w-[80px] rounded-2xl py-3 text-center transition-all cursor-pointer ${
                isActive
                  ? 'bg-sky-850 text-white shadow-md dark:bg-sky-600'
                  : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-[10px] opacity-75">{dayNames[dayNum]}</span>
              <span className="mt-1 text-base font-bold">{dayNum}</span>
            </button>
          );
        })}
      </div>

      {/* Doctor Schedule Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {doctors.map((doctorName, index) => {
          const doctorAppts = appointments.filter(a => a.doctorName === doctorName);
          
          return (
            <div 
              key={index} 
              className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="h-10 w-10 rounded-full bg-teal-50 overflow-hidden relative dark:bg-slate-800 flex items-center justify-center">
                  <svg className="h-6 w-6 text-teal-600 dark:text-teal-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <div className="text-end">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">{doctorName}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    {index === 0 ? activeTrans.familyMedicine : activeTrans.cardiology}
                  </p>
                </div>
              </div>

              {/* Timed Cards */}
              <div className="space-y-3">
                {doctorAppts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 italic">
                    {lang === 'ar' ? 'لا توجد مواعيد مجدولة لهذا اليوم' : 'No appointments scheduled for this day'}
                  </div>
                ) : (
                  doctorAppts.map((appt) => {
                    const statusColors: Record<Appointment['status'], string> = {
                      scheduled: 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400',
                      confirmed: 'bg-sky-100 text-sky-850 dark:bg-sky-950/20 dark:text-sky-400',
                      completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400',
                      cancelled: 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400',
                      no_show: 'bg-slate-100 text-slate-800 dark:bg-slate-950/20 dark:text-slate-400'
                    };

                    const statusLabels: Record<Appointment['status'], string> = {
                      scheduled: activeTrans.statusWaiting,
                      confirmed: activeTrans.statusConfirmed,
                      completed: lang === 'ar' ? 'تم الفحص' : 'Completed',
                      cancelled: lang === 'ar' ? 'ملغي' : 'Cancelled',
                      no_show: lang === 'ar' ? 'غائب' : 'No Show'
                    };

                    const isEditable = user?.role === 'receptionist' || user?.role === 'director';

                    return (
                      <div 
                        key={appt.id} 
                        className={`rounded-2xl p-4 border transition-all ${
                          appt.status === 'confirmed'
                            ? 'border-sky-200 bg-sky-50/10 dark:border-sky-900/60'
                            : 'bg-slate-50 border-slate-100 dark:bg-slate-850 dark:border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="text-end">
                            <span className="text-[10px] font-bold text-slate-400">{appt.timeSlot}</span>
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{appt.patientName}</h4>
                            <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                              {appt.reason} • {appt.room}
                            </p>
                          </div>
                          
                          <button
                            type="button"
                            disabled={!isEditable}
                            onClick={() => cycleAppointmentStatus(appt.id)}
                            className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                              statusColors[appt.status]
                            } ${isEditable ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`}
                            title={isEditable ? (lang === 'ar' ? 'تغيير الحالة' : 'Change status') : ''}
                          >
                            {statusLabels[appt.status]}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
