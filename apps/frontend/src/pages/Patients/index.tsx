import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { t } from '../../services/localization';
import { api, Patient } from '../../services/api';

export default function Patients() {
  const { lang, user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Form states
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientGender, setNewPatientGender] = useState<'M' | 'F'>('M');
  const [newPatientAgeCat, setNewPatientAgeCat] = useState('19-35 ans');
  const [newPatientBlood, setNewPatientBlood] = useState('O+');
  const [newPatientAllergies, setNewPatientAllergies] = useState('');
  const [newPatientDiseases, setNewPatientDiseases] = useState<string[]>([]);
  const [newPatientNotes, setNewPatientNotes] = useState('');

  const activeTrans = t[lang];
  const isRTL = activeTrans.dir === 'rtl';
  const isDirector = user?.role === 'director';

  const loadPatients = () => {
    api.getPatients().then((res) => {
      if (res.success) {
        setPatients(res.data);
      }
    });
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim() || !newPatientPhone.trim()) return;

    const allergiesArr = newPatientAllergies.trim() 
      ? [{ type: 'other', description: newPatientAllergies.trim() }]
      : [];

    api.createPatient({
      fullName: newPatientName,
      phonePrimary: newPatientPhone,
      gender: newPatientGender,
      ageCategory: newPatientAgeCat,
      bloodType: newPatientBlood,
      allergies: allergiesArr,
      chronicDiseases: newPatientDiseases,
      confidentialNotes: newPatientNotes,
    }).then((res) => {
      if (res.success) {
        loadPatients();
        // Reset form
        setNewPatientName('');
        setNewPatientPhone('');
        setNewPatientGender('M');
        setNewPatientAgeCat('19-35 ans');
        setNewPatientBlood('O+');
        setNewPatientAllergies('');
        setNewPatientDiseases([]);
        setNewPatientNotes('');
        setShowAddPatientModal(false);
      }
    });
  };

  const handleDeletePatient = (id: string) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا المريض؟' : 'Are you sure you want to delete this patient?')) return;
    
    // Simulating director check
    if (!isDirector) {
      alert(lang === 'ar' ? 'عذراً، هذا الإجراء مخصص لمدير العيادة فقط.' : 'Sorry, this action is restricted to the clinic director.');
      return;
    }

    api.deletePatient(id).then((res) => {
      if (res.success) {
        loadPatients();
        if (selectedPatient?.id === id) {
          setSelectedPatient(null);
        }
      }
    });
  };

  const toggleDisease = (disease: string) => {
    setNewPatientDiseases(prev =>
      prev.includes(disease) ? prev.filter(d => d !== disease) : [...prev, disease]
    );
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.fileNumber.includes(patientSearch) ||
      p.phonePrimary.includes(patientSearch)
  );

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        {/* Add Patient Button */}
        {(user?.role === 'receptionist' || isDirector) && (
          <button
            onClick={() => setShowAddPatientModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-sky-800 text-white px-4 py-2.5 text-xs font-bold shadow-md hover:bg-sky-700 active:scale-95 dark:bg-sky-600 dark:hover:bg-sky-500 cursor-pointer"
          >
            <svg className="h-4.5 w-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{activeTrans.addPatient}</span>
          </button>
        )}
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{activeTrans.tabPatients}</h2>
      </div>

      {/* Main Grid: Left is Details panel (if selected), Right/Full is list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Patients List */}
        <div className={`space-y-4 lg:col-span-2`}>
          {/* Search input with search icon */}
          <div className="relative max-w-md text-start">
            <input
              type="text"
              placeholder={activeTrans.searchPlaceholder}
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-400"
            />
            <div className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRTL ? 'left-4' : 'right-4'}`}>
              <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPatients.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
                {activeTrans.noPatientsFound}
              </div>
            ) : (
              filteredPatients.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className={`group flex flex-col justify-between rounded-3xl border p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900 cursor-pointer ${
                    selectedPatient?.id === p.id 
                      ? 'border-sky-500 ring-2 ring-sky-100 dark:ring-sky-950/40 bg-sky-50/10 dark:bg-slate-850/30' 
                      : 'border-slate-100 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    {/* Action Arrow Icon Button */}
                    <div className="flex items-center gap-1">
                      {isDirector && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePatient(p.id);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 transition-colors"
                          title="حذف المريض"
                        >
                          <svg className="h-4.5 w-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                      <button 
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-sky-50 group-hover:text-sky-700 dark:bg-slate-800 dark:group-hover:bg-slate-750 dark:group-hover:text-sky-400"
                      >
                        <svg className={`h-4.5 w-4.5 fill-none stroke-current stroke-2 transform ${isRTL ? '' : 'rotate-180'}`} viewBox="0 0 24 24">
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      </button>
                    </div>

                    {/* Avatar & Patient Basic info */}
                    <div className="flex items-center gap-3.5 text-start">
                      <div className="text-end">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">{p.fullName}</h3>
                        <span className="mt-1 inline-block font-mono text-xs text-slate-400 dark:text-slate-500">
                          # {p.fileNumber}
                        </span>
                      </div>
                      
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800">
                        {p.gender === 'F' ? (
                          <svg className="h-9 w-9 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                          </svg>
                        ) : (
                          <svg className="h-9 w-9 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4.5h-2V7h2v5z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact & Date section */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2 dark:border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{p.phonePrimary}</span>
                      <span className="flex items-center gap-1.5 text-slate-400">
                        {activeTrans.phoneLabel}
                        <svg className="h-3.5 w-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-sky-700 dark:text-sky-400">{p.lastVisit}</span>
                      <span className="flex items-center gap-1.5 text-slate-400">
                        {activeTrans.lastVisitLabel}
                        <svg className="h-3.5 w-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Patient Details (Layered RBAC visibility) */}
        <div className="lg:col-span-1 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-start min-h-[400px]">
          {selectedPatient ? (
            <div className="space-y-6">
              <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="mx-auto h-20 w-20 rounded-full bg-slate-50 dark:bg-slate-850 flex items-center justify-center relative overflow-hidden mb-3">
                  <svg className="h-12 w-12 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100">{selectedPatient.fullName}</h3>
                <span className="inline-block rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-mono text-sky-800 dark:bg-sky-950/20 dark:text-sky-400 mt-1">
                  File #{selectedPatient.fileNumber}
                </span>
              </div>

              {/* General details */}
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-450">{activeTrans.phoneLabel}:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPatient.phonePrimary}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">{activeTrans.ageCategoryLabel}:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPatient.ageCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">{activeTrans.genderLabel}:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedPatient.gender === 'M' ? activeTrans.genderMale : activeTrans.genderFemale}
                  </span>
                </div>
                {selectedPatient.bloodType && (
                  <div className="flex justify-between">
                    <span className="text-slate-450">{lang === 'ar' ? 'فصيلة الدم' : 'Blood Group'}:</span>
                    <span className="font-bold text-red-500">{selectedPatient.bloodType}</span>
                  </div>
                )}
              </div>

              {/* Medical history (Doctor/Director only) */}
              {(isDirector || user?.role === 'doctor') ? (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <h4 className="font-extrabold text-xs text-sky-800 dark:text-sky-400 uppercase tracking-wider">
                    {lang === 'ar' ? 'الملف الطبي والتاريخ المكتوب' : 'Medical Records'}
                  </h4>

                  {/* Chronic Diseases */}
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">
                      {lang === 'ar' ? 'الأمراض المزمنة:' : 'Chronic Diseases:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPatient.chronicDiseases && selectedPatient.chronicDiseases.length > 0 ? (
                        selectedPatient.chronicDiseases.map((dis, i) => (
                          <span key={i} className="rounded-lg bg-red-50 px-2 py-0.5 text-xs text-red-700 font-bold dark:bg-red-950/20 dark:text-red-400">
                            {dis}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">لا توجد</span>
                      )}
                    </div>
                  </div>

                  {/* Allergies */}
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">
                      {lang === 'ar' ? 'الحساسية:' : 'Allergies:'}
                    </span>
                    <div className="space-y-1">
                      {selectedPatient.allergies && selectedPatient.allergies.length > 0 ? (
                        selectedPatient.allergies.map((alg, i) => (
                          <div key={i} className="text-xs bg-amber-50 p-2 rounded-xl text-amber-800 dark:bg-amber-950/20 dark:text-amber-300 font-medium">
                            <span className="font-extrabold uppercase text-[9px] mr-1">{alg.type}:</span> {alg.description}
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">لا توجد حساسية مسجلة</span>
                      )}
                    </div>
                  </div>

                  {/* Confidential Notes */}
                  {selectedPatient.confidentialNotes && (
                    <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                      <span className="text-xs text-slate-450 block mb-1.5 font-bold">
                        {lang === 'ar' ? 'ملاحظات الطبيب السرية:' : 'Confidential Notes:'}
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {selectedPatient.confidentialNotes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center py-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed text-xs text-slate-400">
                  {lang === 'ar' 
                    ? 'الملف الطبي السري مقيد بالأطباء والمدير فقط.' 
                    : 'Confidential medical profile restricted to clinical roles.'}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-slate-400 text-xs">
              {lang === 'ar' ? 'حدد مريضاً لاستعراض تفاصيل ملفه بالكامل' : 'Select a patient to view their complete dossier details.'}
            </div>
          )}
        </div>
      </div>

      {/* POPUP MODAL: ADD PATIENT */}
      {showAddPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 animate-fadeIn my-8 text-start">
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setShowAddPatientModal(false)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
              >
                <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">{activeTrans.addPatientTitle}</h3>
            </div>

            <form onSubmit={handleAddPatient} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">{activeTrans.fullNameLabel}</label>
                <input
                  type="text"
                  required
                  placeholder="أدخل اسم المريض..."
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-850 outline-none focus:border-sky-500 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">{activeTrans.phoneLabel}</label>
                <input
                  type="tel"
                  required
                  placeholder="050-000-0000"
                  value={newPatientPhone}
                  onChange={(e) => setNewPatientPhone(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-850 outline-none focus:border-sky-500 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">{activeTrans.ageCategoryLabel}</label>
                  <select
                    value={newPatientAgeCat}
                    onChange={(e) => setNewPatientAgeCat(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none dark:border-slate-850 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="0-1 an">0-1 سنة</option>
                    <option value="1-5 ans">1-5 سنوات</option>
                    <option value="6-12 ans">6-12 سنة</option>
                    <option value="13-18 ans">13-18 سنة</option>
                    <option value="19-35 ans">19-35 سنة</option>
                    <option value="36-50 ans">36-50 سنة</option>
                    <option value="51-65 ans">51-65 سنة</option>
                    <option value="65+ ans">65+ سنة</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">{activeTrans.genderLabel}</label>
                  <div className="mt-1.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewPatientGender('F')}
                      className={`flex-1 rounded-xl py-2 text-center text-xs font-bold transition-all cursor-pointer ${
                        newPatientGender === 'F'
                          ? 'bg-pink-100 text-pink-700 ring-2 ring-pink-300 dark:bg-pink-950/40 dark:text-pink-400'
                          : 'bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-850'
                      }`}
                    >
                      {activeTrans.genderFemale}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPatientGender('M')}
                      className={`flex-1 rounded-xl py-2 text-center text-xs font-bold transition-all cursor-pointer ${
                        newPatientGender === 'M'
                          ? 'bg-sky-100 text-sky-700 ring-2 ring-sky-300 dark:bg-sky-950/40 dark:text-sky-400'
                          : 'bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-850'
                      }`}
                    >
                      {activeTrans.genderMale}
                    </button>
                  </div>
                </div>
              </div>

              {/* Extended fields (Clinical features) */}
              {(isDirector || user?.role === 'doctor') && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                  <h4 className="font-extrabold text-xs text-sky-850 dark:text-sky-400 uppercase tracking-wide">
                    {lang === 'ar' ? 'بيانات الملف الطبي (للطبيب/المدير):' : 'Medical File Inputs:'}
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase">
                        {lang === 'ar' ? 'فصيلة الدم' : 'Blood Group'}
                      </label>
                      <select
                        value={newPatientBlood}
                        onChange={(e) => setNewPatientBlood(e.target.value)}
                        className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none dark:border-slate-850 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase">
                        {lang === 'ar' ? 'الحساسية (أدوية/أغذية)' : 'Allergies'}
                      </label>
                      <input
                        type="text"
                        placeholder="مثل: بنسلين، فراولة..."
                        value={newPatientAllergies}
                        onChange={(e) => setNewPatientAllergies(e.target.value)}
                        className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-850 outline-none focus:border-sky-500 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {/* Chronic Diseases checkboxes */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-2">
                      {lang === 'ar' ? 'الأمراض المزمنة' : 'Chronic Diseases'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['diabetes', 'hypertension', 'asthma', 'other'].map((dis) => {
                        const isChecked = newPatientDiseases.includes(dis);
                        const labelAr: Record<string, string> = {
                          diabetes: 'السكري',
                          hypertension: 'ضغط الدم',
                          asthma: 'الربو',
                          other: 'أخرى'
                        };
                        return (
                          <button
                            key={dis}
                            type="button"
                            onClick={() => toggleDisease(dis)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              isChecked 
                                ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400' 
                                : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-950 dark:border-slate-850'
                            }`}
                          >
                            {lang === 'ar' ? labelAr[dis] : dis}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Confidential Notes */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase">
                      {lang === 'ar' ? 'ملاحظات سرية (للطبيب)' : 'Confidential Notes'}
                    </label>
                    <textarea
                      placeholder="أدخل الملاحظات والتشخيص السري للمريض..."
                      value={newPatientNotes}
                      onChange={(e) => setNewPatientNotes(e.target.value)}
                      rows={3}
                      className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-850 outline-none focus:border-sky-500 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-100 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-sky-800 py-3.5 text-xs font-bold text-white shadow-md hover:bg-sky-700 dark:bg-sky-600 cursor-pointer"
                >
                  {activeTrans.savePatient}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
