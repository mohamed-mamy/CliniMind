import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { t } from '../../services/localization';
import { api, Appointment, UserDto, Patient } from '../../services/api';

const STATUS_CYCLE: Appointment['status'][] = ['scheduled', 'confirmed', 'completed', 'cancelled'];

const STATUS_COLORS: Record<Appointment['status'], string> = {
  scheduled: 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  confirmed: 'bg-sky-100 text-sky-800 dark:bg-sky-950/20 dark:text-sky-400 border-sky-200 dark:border-sky-800',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400 border-red-200 dark:border-red-800',
  no_show: 'bg-slate-100 text-slate-800 dark:bg-slate-950/20 dark:text-slate-400 border-slate-200 dark:border-slate-800',
};

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(dateStr: string, lang: string): string {
  const d = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : 'en-US', options);
}

const HOURS = Array.from({ length: 10 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);

export default function Appointments() {
  const { lang, user } = useAuth();
  const activeTrans = t[lang];
  const isEditable = user?.role === 'receptionist' || user?.role === 'director';
  const canChangeStatus = user?.role === 'receptionist' || user?.role === 'director' || user?.role === 'doctor';
  const isRTL = activeTrans.dir === 'rtl';

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (user?.role !== 'doctor') {
      api.getUsers({ role: 'doctor' }).then(res => {
        if (res.success) setDoctors(res.data);
        else console.warn('Failed to load doctors:', res.error);
      }).catch((err) => console.error('Failed to load doctors:', err));
    }
  }, [user]);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = new Date(selectedDate);
      from.setUTCHours(0, 0, 0, 0);
      const to = new Date(selectedDate);
      to.setUTCHours(23, 59, 59, 999);
      const params: any = { from: from.toISOString(), to: to.toISOString() };
      if (selectedDoctorId) params.doctorId = selectedDoctorId;
      const res = await api.getAppointments(params);
      if (res.success) {
        setAppointments(res.data);
      } else {
        setError(res.error || 'Failed to load appointments');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedDoctorId]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const cycleStatus = async (appt: Appointment) => {
    const idx = STATUS_CYCLE.indexOf(appt.status);
    const nextStatus = idx === -1 ? STATUS_CYCLE[0] : STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    try {
      const res = await api.updateAppointmentStatus(appt.id, nextStatus);
      if (res.success) {
        setAppointments(prev => prev.map(a => a.id === appt.id ? res.data : a));
      }
    } catch {
      // Silently fail
    }
  };

  const statusLabels: Record<Appointment['status'], string> = {
    scheduled: activeTrans.statusWaiting,
    confirmed: activeTrans.statusConfirmed,
    completed: activeTrans.statusCompleted,
    cancelled: activeTrans.statusCancelled,
    no_show: activeTrans.statusNoShow,
  };

  const goToday = () => setSelectedDate(formatDate(new Date()));

  const currentDoctorName = selectedDoctorId
    ? doctors.find(d => d._id === selectedDoctorId)?.fullName || ''
    : user?.role === 'doctor'
    ? user?.fullName || ''
    : lang === 'ar' ? 'كل الأطباء' : lang === 'fr' ? 'Tous les médecins' : 'All doctors';

  return (
    <div className="animate-fadeIn space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        {isEditable && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-sky-800 text-white px-4 py-2.5 text-xs font-bold shadow-md hover:bg-sky-700 active:scale-95 dark:bg-sky-600 dark:hover:bg-sky-500 cursor-pointer"
          >
            <svg className="h-4.5 w-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{activeTrans.addAppointment}</span>
          </button>
        )}

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        />

        <button
          onClick={goToday}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-sky-700 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-900 dark:text-sky-400 cursor-pointer"
        >
          {lang === 'ar' ? 'اليوم' : lang === 'fr' ? "Aujourd'hui" : 'Today'}
        </button>

        {/* Doctor selector */}
        <div className="flex items-center gap-2">
          {user?.role === 'doctor' ? (
            <span className="rounded-2xl bg-teal-50 px-4 py-2.5 text-xs font-bold text-teal-700 dark:bg-teal-950/20 dark:text-teal-400">
              {user.fullName}
            </span>
          ) : (
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="">{lang === 'ar' ? 'كل الأطباء' : lang === 'fr' ? 'Tous les médecins' : 'All doctors'}</option>
              {doctors.map(d => (
                <option key={d._id} value={d._id}>{d.fullName}</option>
              ))}
            </select>
          )}
        </div>

        <div className="mr-auto text-end">
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
            {formatDateDisplay(selectedDate, lang)}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{currentDoctorName}</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/20">
          <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={loadAppointments}
            className="mt-3 rounded-xl bg-red-100 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-400 cursor-pointer"
          >
            {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && appointments.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-200 p-16 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <svg className="mx-auto h-12 w-12 mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {activeTrans.noAppointments}
        </div>
      )}

      {/* Timeline Agenda */}
      {!loading && !error && appointments.length > 0 && (
        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-1">
            {HOURS.map((hour) => {
              const hourNum = parseInt(hour, 10);
              const apptsAtHour = appointments.filter(a => {
                const aHour = parseInt(a.timeSlot.split(':')[0], 10);
                return aHour === hourNum;
              });

              return (
                <div key={hour} className="flex items-start gap-3 group">
                  {/* Time label */}
                  <div className={`w-14 pt-2 text-center shrink-0 ${isRTL ? 'ml-3' : 'mr-3'}`}>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{hour}</span>
                  </div>

                  {/* Timeline line */}
                  <div className="relative flex-1 min-h-[48px] border-t border-slate-100 dark:border-slate-800/60">
                    {/* Dot on line */}
                    <div className={`absolute -top-1.5 ${isRTL ? '-right-1.5' : '-left-1.5'} h-3 w-3 rounded-full border-2 border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900 group-hover:border-sky-400 transition-colors`} />

                    {/* Appointments at this hour */}
                    <div className={`flex flex-wrap gap-2 pt-1 ${isRTL ? 'mr-4' : 'ml-4'}`}>
                      {apptsAtHour.length === 0 && (
                        <span className="text-[10px] text-slate-300 dark:text-slate-600 italic py-1 px-2">
                          —
                        </span>
                      )}
                      {apptsAtHour.map((appt) => (
                        <div
                          key={appt.id}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition-all ${
                            STATUS_COLORS[appt.status].split(' ').slice(0, 2).join(' ')
                          }`}
                        >
                          <span className="font-mono font-bold text-[10px] opacity-70">{appt.timeSlot}</span>
                          <span className="font-bold">{appt.patientName}</span>
                          {appt.reason && (
                            <span className="opacity-60 hidden sm:inline">• {appt.reason}</span>
                          )}
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${STATUS_COLORS[appt.status]}`}>
                            {statusLabels[appt.status]}
                          </span>
                          {canChangeStatus && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); cycleStatus(appt); }}
                              className="rounded-full p-1 text-slate-400 hover:bg-white/50 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 cursor-pointer transition-colors"
                              title={activeTrans.changeStatus}
                            >
                              <svg className="h-3.5 w-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                                <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Appointment Modal */}
      {showAddModal && (
        <AddAppointmentModal
          lang={lang}
          activeTrans={activeTrans}
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            loadAppointments();
          }}
          selectedDoctorId={selectedDoctorId}
        />
      )}
    </div>
  );
}

function AddAppointmentModal({
  lang,
  activeTrans,
  onClose,
  onSaved,
  selectedDoctorId,
}: {
  lang: string;
  activeTrans: Record<string, string>;
  onClose: () => void;
  onSaved: () => void;
  selectedDoctorId: string;
}) {
  const [doctors, setDoctors] = useState<UserDto[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [doctorId, setDoctorId] = useState(selectedDoctorId || '');
  const [date, setDate] = useState(formatDate(new Date()));
  const [timeSlot, setTimeSlot] = useState('09:00');
  const [reason, setReason] = useState('');
  const [type, setType] = useState('normal');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getUsers({ role: 'doctor' }).then(res => {
      if (res.success) setDoctors(res.data);
    }).catch((err) => console.error('Failed to load doctors:', err));
    api.getPatients().then(res => {
      if (res.success) setPatients(res.data);
    }).catch((err) => console.error('Failed to load patients:', err));
  }, []);

  const filteredPatients = patients.filter(p =>
    !patientSearch || p.fullName.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.fileNumber.includes(patientSearch) || p.phonePrimary.includes(patientSearch)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !doctorId || !date || !timeSlot) return;

    setSaving(true);
    setError(null);
    try {
      const res = await api.createAppointment({
        patientId: selectedPatient.id,
        doctorId,
        date: new Date(date).toISOString(),
        timeSlot,
        reason,
        type,
      });
      if (res.success) {
        onSaved();
      } else {
        setError(res.error || 'Failed to create appointment');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to create appointment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 animate-fadeIn my-8">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
          >
            <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{activeTrans.addAppointmentTitle}</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase">{activeTrans.selectPatient}</label>
            <input
              type="text"
              placeholder={lang === 'ar' ? 'البحث عن مريض...' : lang === 'fr' ? 'Rechercher un patient...' : 'Search patient...'}
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
            {filteredPatients.length > 0 && (
              <div className="mt-1 max-h-32 overflow-y-auto rounded-xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
                {filteredPatients.slice(0, 10).map(p => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => { setSelectedPatient(p); setPatientSearch(p.fullName); }}
                    className={`w-full px-3 py-2 text-xs text-start hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors ${
                      selectedPatient?.id === p.id ? 'bg-sky-50 dark:bg-slate-800 font-bold' : ''
                    }`}
                  >
                    {p.fullName} <span className="text-slate-400">#{p.fileNumber}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase">{activeTrans.selectDoctor}</label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="">--</option>
              {doctors.map(d => (
                <option key={d._id} value={d._id}>{d.fullName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">{activeTrans.appointmentDate}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">{activeTrans.appointmentTime}</label>
              <input
                type="time"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase">{activeTrans.appointmentType}</label>
            <div className="mt-1 flex gap-2">
              {(['normal', 'followup', 'emergency', 'checkup'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-xl py-2 text-center text-xs font-bold transition-all cursor-pointer ${
                    type === t
                      ? 'bg-sky-100 text-sky-700 ring-2 ring-sky-300 dark:bg-sky-950/40 dark:text-sky-400'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-800'
                  }`}
                >
                  {t === 'normal' ? activeTrans.typeNormal :
                   t === 'followup' ? activeTrans.typeFollowup :
                   t === 'emergency' ? activeTrans.typeEmergency :
                   activeTrans.typeCheckup}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase">{activeTrans.appointmentReason}</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={lang === 'ar' ? 'سبب الزيارة...' : lang === 'fr' ? 'Motif de la visite...' : 'Reason for visit...'}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving || !selectedPatient || !doctorId}
            className="w-full rounded-2xl bg-sky-800 py-3.5 text-xs font-bold text-white shadow-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-sky-600 cursor-pointer"
          >
            {saving ? (lang === 'ar' ? 'جاري الحفظ...' : lang === 'fr' ? 'Enregistrement...' : 'Saving...') : activeTrans.saveAppointment}
          </button>
        </form>
      </div>
    </div>
  );
}