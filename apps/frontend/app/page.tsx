"use client";

import { useState, useEffect } from "react";

// Types
interface Patient {
  id: string;
  fullName: string;
  fileNumber: string;
  phonePrimary: string;
  lastVisit: string;
  ageCategory: string;
  gender: "M" | "F";
}

interface Appointment {
  id: string;
  patientName: string;
  timeSlot: string;
  reason: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  doctorName: string;
  room: string;
}

interface LabRequest {
  id: string;
  patientName: string;
  location: string;
  testName: string;
  priority: "normal" | "urgent";
  status: "pending" | "in_progress" | "completed";
  time: string;
}

interface PharmacyItem {
  id: string;
  name: string;
  scientificName: string;
  stock: number;
  minThreshold: number;
  unit: string;
}

interface UrgentNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "critical" | "warning";
}

// Translations Dictionary
const t = {
  ar: {
    dir: "rtl",
    appName: "CliniMind",
    loginSubtitle: "مرحباً بعودتك، يرجى تسجيل الدخول للمتابعة",
    usernamePlaceholder: "اسم المستخدم أو البريد الإلكتروني",
    passwordPlaceholder: "كلمة المرور",
    forgotPassword: "هل نسيت كلمة المرور؟",
    loginBtn: "تسجيل الدخول",
    biometricLogin: "تسجيل الدخول البيومتري",
    biometricToast: "جاري تهيئة القارئ البيومتري...",
    loginError: "اسم المستخدم أو كلمة المرور غير صحيحة",
    logout: "تسجيل الخروج",
    clinicDirector: "مدير العيادة",
    // Tabs
    tabDashboard: "نظرة عامة",
    tabPatients: "إدارة المرضى",
    tabSchedule: "المواعيد",
    tabMedical: "الحالة الطبية والمخزون",
    // Dashboard
    statsTotalPatients: "إجمالي المرضى",
    statsTodayVisitors: "مراجعو اليوم",
    statsPendingLabs: "نتائج المختبر المعلقة",
    statsTodayRevenue: "الإيرادات (اليوم)",
    statsMonthlyTrend: "هذا الشهر",
    statsInWaiting: "في الانتظار",
    statsCritical: "حرجة",
    urgentNotifications: "الإشعارات العاجلة",
    revenueTrends: "اتجاهات الإيرادات",
    last7Days: "آخر 7 أيام",
    newAlerts: "جديد",
    potassiumAlert: "المريض: أحمد محمد - مستوى البوتاسيوم مرتفع جداً (6.5 mmol/L)",
    stockAlert: "مخزون القفازات المعقمة (حجم L) أقل من الحد الأدنى",
    tenMinsAgo: "منذ 10 دقائق",
    oneHourAgo: "منذ ساعة",
    today: "اليوم",
    currency: "ريال",
    // Patients
    searchPlaceholder: "البحث بالاسم، رقم الملف، أو الهاتف...",
    addPatient: "إضافة مريض",
    addPatientTitle: "إضافة مريض جديد",
    savePatient: "حفظ المريض",
    fullNameLabel: "الاسم الكامل",
    phoneLabel: "رقم الهاتف",
    ageCategoryLabel: "الفئة العمرية",
    genderLabel: "الجنس",
    genderMale: "ذكر",
    genderFemale: "أنثى",
    noPatientsFound: "لا يوجد مرضى يطابقون بحثك",
    lastVisitLabel: "آخر زيارة",
    // Schedule
    october2023: "أكتوبر 2023",
    familyMedicine: "طب الأسرة",
    cardiology: "أمراض القلب",
    room: "غرفة",
    statusWaiting: "في الانتظار",
    statusExam: "جاري الفحص",
    statusArrived: "وصل",
    statusConfirmed: "مؤكد",
    // Medical/Lab
    pharmacyStock: "مخزون الصيدلية",
    hospitalRequests: "طلبات المشفى",
    urgentCases: "حالات عاجلة",
    routineRequests: "طلبات روتينية",
    autoUpdate: "تحديث تلقائي",
    testType: "نوع التحليل",
    enterResults: "إدخال النتائج",
    details: "التفاصيل",
    startTest: "بدء التحليل",
    testCompleted: "تم إدخال النتائج وإرسال الإشعار",
    stockStatus: "تحديث المخزون الفوري",
    emergencyStock: "مخزون الطوارئ",
    lowStock: "منخفض",
  },
  en: {
    dir: "ltr",
    appName: "CliniMind",
    loginSubtitle: "Welcome back, please log in to continue",
    usernamePlaceholder: "Username or Email",
    passwordPlaceholder: "Password",
    forgotPassword: "Forgot Password?",
    loginBtn: "Log In",
    biometricLogin: "Biometric Login",
    biometricToast: "Initializing biometric reader...",
    loginError: "Invalid username or password",
    logout: "Log Out",
    clinicDirector: "Clinic Director",
    // Tabs
    tabDashboard: "Dashboard",
    tabPatients: "Patients",
    tabSchedule: "Schedule",
    tabMedical: "Medical & Stock",
    // Dashboard
    statsTotalPatients: "Total Patients",
    statsTodayVisitors: "Today's Visitors",
    statsPendingLabs: "Pending Lab Results",
    statsTodayRevenue: "Today's Revenue",
    statsMonthlyTrend: "this month",
    statsInWaiting: "in waiting",
    statsCritical: "critical",
    urgentNotifications: "Urgent Notifications",
    revenueTrends: "Revenue Trends",
    last7Days: "Last 7 Days",
    newAlerts: "new",
    potassiumAlert: "Patient: Ahmad Mohamed - Potassium level very high (6.5 mmol/L)",
    stockAlert: "Sterile gloves stock (Size L) below safety threshold",
    tenMinsAgo: "10 mins ago",
    oneHourAgo: "1 hour ago",
    today: "Today",
    currency: "SAR",
    // Patients
    searchPlaceholder: "Search by name, file number, or phone...",
    addPatient: "Add Patient",
    addPatientTitle: "Add New Patient",
    savePatient: "Save Patient",
    fullNameLabel: "Full Name",
    phoneLabel: "Phone Number",
    ageCategoryLabel: "Age Category",
    genderLabel: "Gender",
    genderMale: "Male",
    genderFemale: "Female",
    noPatientsFound: "No patients match your search",
    lastVisitLabel: "Last Visit",
    // Schedule
    october2023: "October 2023",
    familyMedicine: "Family Medicine",
    cardiology: "Cardiology",
    room: "Room",
    statusWaiting: "Waiting",
    statusExam: "In Exam",
    statusArrived: "Arrived",
    statusConfirmed: "Confirmed",
    // Medical/Lab
    pharmacyStock: "Pharmacy Stock",
    hospitalRequests: "Hospital Requests",
    urgentCases: "Urgent Cases",
    routineRequests: "Routine Requests",
    autoUpdate: "Auto Update",
    testType: "Test Type",
    enterResults: "Enter Results",
    details: "Details",
    startTest: "Start Test",
    testCompleted: "Results entered and doctor notified",
    stockStatus: "Real-time Stock Status",
    emergencyStock: "Emergency Stock",
    lowStock: "Low Stock",
  },
  fr: {
    dir: "ltr",
    appName: "CliniMind",
    loginSubtitle: "Ravi de vous revoir, veuillez vous connecter pour continuer",
    usernamePlaceholder: "Nom d'utilisateur ou Email",
    passwordPlaceholder: "Mot de passe",
    forgotPassword: "Mot de passe oublié?",
    loginBtn: "Se Connecter",
    biometricLogin: "Connexion Biométrique",
    biometricToast: "Initialisation du lecteur biométrique...",
    loginError: "Nom d'utilisateur ou mot de passe incorrect",
    logout: "Déconnexion",
    clinicDirector: "Directeur de Clinique",
    // Tabs
    tabDashboard: "Aperçu",
    tabPatients: "Patients",
    tabSchedule: "Rendez-vous",
    tabMedical: "Médical & Stock",
    // Dashboard
    statsTotalPatients: "Total Patients",
    statsTodayVisitors: "Visiteurs du Jour",
    statsPendingLabs: "Analyses en Attente",
    statsTodayRevenue: "Revenus (Jour)",
    statsMonthlyTrend: "ce mois",
    statsInWaiting: "en attente",
    statsCritical: "critiques",
    urgentNotifications: "Notifications Urgentes",
    revenueTrends: "Tendances des Revenus",
    last7Days: "7 Derniers Jours",
    newAlerts: "nouveau",
    potassiumAlert: "Patient: Ahmad Mohamed - Niveau de potassium très élevé (6.5 mmol/L)",
    stockAlert: "Stock de gants stériles (Taille L) inférieur au seuil",
    tenMinsAgo: "il y a 10 min",
    oneHourAgo: "il y a 1 h",
    today: "Aujourd'hui",
    currency: "SAR",
    // Patients
    searchPlaceholder: "Rechercher par nom, dossier ou tél...",
    addPatient: "Ajouter Patient",
    addPatientTitle: "Ajouter un Nouveau Patient",
    savePatient: "Enregistrer",
    fullNameLabel: "Nom Complet",
    phoneLabel: "Numéro de Téléphone",
    ageCategoryLabel: "Catégorie d'Âge",
    genderLabel: "Genre",
    genderMale: "Homme",
    genderFemale: "Femme",
    noPatientsFound: "Aucun patient ne correspond",
    lastVisitLabel: "Dernière Visite",
    // Schedule
    october2023: "Octobre 2023",
    familyMedicine: "Médecine Familiale",
    cardiology: "Cardiologie",
    room: "Salle",
    statusWaiting: "En Attente",
    statusExam: "En Examen",
    statusArrived: "Arrivé",
    statusConfirmed: "Confirmé",
    // Medical/Lab
    pharmacyStock: "Stock Pharmacie",
    hospitalRequests: "Demandes Hôpital",
    urgentCases: "Cas Urgents",
    routineRequests: "Demandes Routinières",
    autoUpdate: "Mise à jour auto",
    testType: "Type d'Analyse",
    enterResults: "Saisir Résultats",
    details: "Détails",
    startTest: "Lancer l'Analyse",
    testCompleted: "Résultats saisis et médecin notifié",
    stockStatus: "État de Stock Instantané",
    emergencyStock: "Stock d'Urgence",
    lowStock: "Faible",
  },
};

type LangKey = "ar" | "en" | "fr";

export default function Home() {
  // Global States
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [lang, setLang] = useState<LangKey>("ar");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showBellDropdown, setShowBellDropdown] = useState<boolean>(false);
  const [showLangDropdown, setShowLangDropdown] = useState<boolean>(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState<boolean>(false);

  // Login form inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginErrorMsg, setLoginErrorMsg] = useState("");
  const [biometricToastText, setBiometricToastText] = useState("");

  // Tab State
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Dynamic Clock
  const [timeStr, setTimeStr] = useState<string>("19:42");

  // Mock Data States
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: "1",
      fullName: "يوسف عبدالله",
      fileNumber: "9482",
      phonePrimary: "050-123-4567",
      lastVisit: "اليوم",
      ageCategory: "19-35 ans",
      gender: "M",
    },
    {
      id: "2",
      fullName: "سارة العتيبي",
      fileNumber: "7391",
      phonePrimary: "055-987-6543",
      lastVisit: "12 مايو",
      ageCategory: "19-35 ans",
      gender: "F",
    },
    {
      id: "3",
      fullName: "محمد الفهد",
      fileNumber: "1024",
      phonePrimary: "053-444-5555",
      lastVisit: "3 مارس 2023",
      ageCategory: "36-50 ans",
      gender: "M",
    },
  ]);

  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: "1",
      patientName: "فاطمة علي محمد",
      timeSlot: "09:00",
      reason: "مراجعة دورية",
      status: "scheduled",
      doctorName: "د. أحمد يوسف",
      room: "غرفة 3",
    },
    {
      id: "2",
      patientName: "خالد حسن عبدالله",
      timeSlot: "10:30",
      reason: "استشارة طبية",
      status: "confirmed",
      doctorName: "د. أحمد يوسف",
      room: "غرفة 3",
    },
    {
      id: "3",
      patientName: "مريم سعد الجاسم",
      timeSlot: "11:15",
      reason: "تخطيط قلب",
      status: "completed",
      doctorName: "د. سارة محمود",
      room: "غرفة 1",
    },
    {
      id: "4",
      patientName: "عمر طارق زكي",
      timeSlot: "01:00",
      reason: "متابعة ضغط الدم",
      status: "confirmed",
      doctorName: "د. سارة محمود",
      room: "غرفة 2",
    },
  ]);

  const [labRequests, setLabRequests] = useState<LabRequest[]>([
    {
      id: "1",
      patientName: "فاطمة علي سعيد",
      location: "غرفة العناية المركزة - سرير 4",
      testName: "غازات الدم الشرياني (ABG)",
      priority: "urgent",
      status: "pending",
      time: "منذ 10 دقائق",
    },
    {
      id: "2",
      patientName: "محمد عبدالله",
      location: "قسم الطوارئ",
      testName: "زراعة دم سريع (Blood Culture)",
      priority: "urgent",
      status: "pending",
      time: "منذ 25 دقيقة",
    },
    {
      id: "3",
      patientName: "خالد إبراهيم",
      location: "العيادات الخارجية",
      testName: "وظائف الكبد (LFT)",
      priority: "normal",
      status: "pending",
      time: "وقت الطلب: 09:30 ص",
    },
    {
      id: "4",
      patientName: "نورة سعيد",
      location: "جناح النساء والولادة",
      testName: "تحليل بول كامل",
      priority: "normal",
      status: "pending",
      time: "وقت الطلب: 10:15 ص",
    },
  ]);

  const [notifications, setNotifications] = useState<UrgentNotification[]>([
    {
      id: "1",
      title: "نتيجة مختبر حرجة",
      description: "المريض: أحمد محمد - مستوى البوتاسيوم مرتفع جداً (6.5 mmol/L).",
      time: "منذ 10 دقائق",
      type: "critical",
    },
    {
      id: "2",
      title: "نقص في المخزون",
      description: "مخزون القفازات المعقمة (حجم L) أقل من الحد الأدنى.",
      time: "منذ ساعة",
      type: "warning",
    },
  ]);

  const pharmacyInventory: PharmacyItem[] = [
    { id: "1", name: "باراسيتامول 500 ملغ", scientificName: "Paracetamol", stock: 450, minThreshold: 100, unit: "علبة" },
    { id: "2", name: "أموكسيسيلين 250 ملغ", scientificName: "Amoxicillin", stock: 24, minThreshold: 50, unit: "علبة" },
    { id: "3", name: "إنسولين سريع المفعول", scientificName: "Insulin Aspart", stock: 85, minThreshold: 20, unit: "أمبول" },
    { id: "4", name: "قفازات طبية معقمة L", scientificName: "Sterile Gloves (Size L)", stock: 12, minThreshold: 50, unit: "صندوق" },
    { id: "5", name: "فنتولين بخاخ", scientificName: "Salbutamol Inhaler", stock: 110, minThreshold: 30, unit: "بخاخ" },
  ];

  // Forms states
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [newPatientGender, setNewPatientGender] = useState<"M" | "F">("M");
  const [newPatientAgeCat, setNewPatientAgeCat] = useState("19-35 ans");

  // Search/Filters states
  const [patientSearch, setPatientSearch] = useState("");
  const [scheduleActiveDay, setScheduleActiveDay] = useState<number>(16);
  const [medicalActiveSubTab, setMedicalActiveSubTab] = useState<"lab" | "pharmacy">("lab");

  // Load theme and setup system clock
  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark";
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const tTimer = setTimeout(() => {
      setDarkMode(isDark);
      const savedLang = localStorage.getItem("lang") as LangKey;
      if (savedLang) setLang(savedLang);
    }, 0);

    // Dynamic Clock
    const clockTimer = setInterval(() => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      setTimeStr(`${hrs}:${mins}`);
    }, 10000);

    return () => {
      clearTimeout(tTimer);
      clearInterval(clockTimer);
    };
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const changeLanguage = (newLang: LangKey) => {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
    setShowLangDropdown(false);
  };

  // Mock Authentication Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    // Simulate simple log in (allowing any user for demonstration)
    if (username.length >= 3 && password.length >= 4) {
      setIsLoggedIn(true);
      setLoginErrorMsg("");
    } else {
      setLoginErrorMsg(t[lang].loginError);
    }
  };

  // Biometric login toggle simulator
  const handleBiometricClick = () => {
    setBiometricToastText(t[lang].biometricToast);
    setTimeout(() => {
      setIsLoggedIn(true);
      setBiometricToastText("");
    }, 1500);
  };

  // Add Patient Action
  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim() || !newPatientPhone.trim()) return;

    const newPatient: Patient = {
      id: String(patients.length + 1),
      fullName: newPatientName,
      fileNumber: String(Math.floor(1000 + Math.random() * 9000)),
      phonePrimary: newPatientPhone,
      lastVisit: t[lang].today,
      ageCategory: newPatientAgeCat,
      gender: newPatientGender,
    };

    setPatients([newPatient, ...patients]);
    setNewPatientName("");
    setNewPatientPhone("");
    setNewPatientGender("M");
    setNewPatientAgeCat("19-35 ans");
    setShowAddPatientModal(false);
  };

  // Cycle appointment status
  const cycleAppointmentStatus = (apptId: string) => {
    setAppointments(
      appointments.map((appt) => {
        if (appt.id === apptId) {
          const statusCycle: Appointment["status"][] = ["scheduled", "confirmed", "completed", "cancelled"];
          const currentIndex = statusCycle.indexOf(appt.status);
          const nextIndex = (currentIndex + 1) % statusCycle.length;
          return { ...appt, status: statusCycle[nextIndex] };
        }
        return appt;
      })
    );
  };

  // Enter results for laboratory request
  const enterLabResult = (reqId: string) => {
    setLabRequests(
      labRequests.map((req) => {
        if (req.id === reqId) {
          return { ...req, status: "completed" as const };
        }
        return req;
      })
    );
  };

  // Start Lab analysis
  const startLabAnalysis = (reqId: string) => {
    setLabRequests(
      labRequests.map((req) => {
        if (req.id === reqId) {
          return { ...req, status: "in_progress" as const };
        }
        return req;
      })
    );
  };

  // Filtered patients list
  const filteredPatients = patients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.fileNumber.includes(patientSearch) ||
      p.phonePrimary.includes(patientSearch)
  );

  const activeTrans = t[lang];
  const isRTL = activeTrans.dir === "rtl";

  return (
    <div
      dir={activeTrans.dir}
      className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-300 bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-200`}
    >
      {/* 1. LOGIN PAGE VIEW (if not logged in) */}
      {!isLoggedIn ? (
        <div className="flex-1 w-full flex items-center justify-center bg-radial-at-t from-slate-800 to-slate-950 p-4 relative overflow-hidden transition-all">
          
          {/* Subtle glowing abstract patterns */}
          <div className="absolute h-96 w-96 rounded-full bg-sky-500/10 blur-3xl top-1/4 -right-10 pointer-events-none"></div>
          <div className="absolute h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl bottom-1/4 -left-10 pointer-events-none"></div>

          {/* Login Card Form */}
          <div className="w-full max-w-sm rounded-[32px] border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md relative z-10 text-center animate-fadeIn">
            
            {/* CliniMind Logo Title */}
            <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
              {activeTrans.appName}
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              {activeTrans.loginSubtitle}
            </p>

            <form onSubmit={handleLoginSubmit} className="mt-8 space-y-4">
              {/* Username Input */}
              <div className="relative text-right">
                <input
                  type="text"
                  required
                  placeholder={activeTrans.usernamePlaceholder}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-850 py-3.5 px-4 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-start"
                />
                <span className={`absolute top-1/2 -translate-y-1/2 text-slate-500 ${isRTL ? "left-4" : "right-4"}`}>
                  <svg className="h-4 w-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
              </div>

              {/* Password Input */}
              <div className="relative text-right">
                <input
                  type="password"
                  required
                  placeholder={activeTrans.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-850 py-3.5 px-4 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-start"
                />
                <span className={`absolute top-1/2 -translate-y-1/2 text-slate-500 ${isRTL ? "left-4" : "right-4"}`}>
                  <svg className="h-4 w-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
              </div>

              {/* Forgot password */}
              <div className="text-start">
                <a href="#" className="text-xs text-slate-400 hover:text-sky-400 transition-colors">
                  {activeTrans.forgotPassword}
                </a>
              </div>

              {/* Error Message */}
              {loginErrorMsg && (
                <div className="rounded-xl bg-red-900/30 p-3 text-xs text-red-400 text-center">
                  {loginErrorMsg}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full rounded-2xl bg-sky-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 hover:shadow-sky-500/30 active:scale-98 transition-all"
              >
                {activeTrans.loginBtn}
              </button>
            </form>

            {/* Biometric login */}
            <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col items-center gap-3">
              <button
                onClick={handleBiometricClick}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-sky-400 hover:bg-slate-750 transition-colors active:scale-95 shadow-md"
                title={activeTrans.biometricLogin}
              >
                {/* Fingerprint icon */}
                <svg className="h-6 w-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 0 0-8 4M12 2a10 10 0 0 1 8 4M12 12a10 10 0 0 0-2 6M12 12c1 0 2.5 1 3 3M8 9a10 10 0 0 1 8 0M6 12a12 12 0 0 1 12 0" />
                  <path d="M12 8v8M10 15c0-1.5 1-3 2-3" />
                </svg>
              </button>
              <span className="text-[11px] font-semibold text-slate-400">
                {activeTrans.biometricLogin}
              </span>
            </div>

            {/* Biometric loading feedback toast */}
            {biometricToastText && (
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-64 rounded-xl bg-slate-900 border border-slate-700 py-2.5 px-4 text-xs font-semibold text-sky-400 text-center animate-fadeIn shadow-xl">
                {biometricToastText}
              </div>
            )}

            {/* Globe Language selector */}
            <div className="mt-8 flex justify-start">
              <div className="relative">
                <button
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <svg className="h-4 w-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span>{lang === "ar" ? "العربية" : lang === "en" ? "English" : "Français"}</span>
                </button>

                {/* Dropdown Options */}
                {showLangDropdown && (
                  <div className="absolute bottom-6 left-0 z-30 w-32 rounded-xl border border-slate-800 bg-slate-850 p-1.5 shadow-xl text-left">
                    <button
                      onClick={() => changeLanguage("ar")}
                      className="w-full text-right rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                      العربية
                    </button>
                    <button
                      onClick={() => changeLanguage("en")}
                      className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                      English
                    </button>
                    <button
                      onClick={() => changeLanguage("fr")}
                      className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                      Français
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // 2. DASHBOARD VIEW (Desktop Layout)
        <div className="flex-1 w-full flex h-screen overflow-hidden">
          
          {/* SIDEBAR NAVIGATION */}
          <aside className="w-64 bg-white border-slate-100 flex flex-col justify-between shrink-0 z-20 shadow-sm border-e dark:border-slate-800 dark:bg-slate-900 transition-colors">
            <div className="flex flex-col">
              {/* Profile Card Section */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 text-center flex flex-col items-center gap-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-sky-100 bg-sky-50 dark:border-sky-950 dark:bg-slate-800 shadow-inner">
                  <svg className="absolute bottom-0 left-1/2 h-14 w-14 -translate-x-1/2 text-sky-600 dark:text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">د. أحمد يوسف</h3>
                  <p className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 mt-0.5">{activeTrans.clinicDirector}</p>
                </div>
              </div>

              {/* Navigation Tabs Menu */}
              <nav className="p-4 space-y-1.5 flex-1">
                {/* 1. Dashboard Tab Link */}
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === "dashboard"
                      ? "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400"
                      : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  <span>{activeTrans.tabDashboard}</span>
                </button>

                {/* 2. Patients Tab Link */}
                <button
                  onClick={() => setActiveTab("patients")}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === "patients"
                      ? "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400"
                      : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>{activeTrans.tabPatients}</span>
                </button>

                {/* 3. Schedule Tab Link */}
                <button
                  onClick={() => setActiveTab("schedule")}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === "schedule"
                      ? "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400"
                      : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{activeTrans.tabSchedule}</span>
                </button>

                {/* 4. Medical / Lab Tab Link */}
                <button
                  onClick={() => setActiveTab("medical")}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === "medical"
                      ? "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400"
                      : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <path d="M6 3h12M12 3v15M10 18h4M8 21h8" />
                    <path d="M9 13a3 3 0 0 1 6 0v5H9v-5Z" />
                  </svg>
                  <span>{activeTrans.tabMedical}</span>
                </button>
              </nav>
            </div>

            {/* Logout button at the bottom of sidebar */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  setUsername("");
                  setPassword("");
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all active:scale-98"
              >
                {/* Logout Icon */}
                <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                <span>{activeTrans.logout}</span>
              </button>
            </div>
          </aside>

          {/* MAIN PAGE LAYOUT PANEL */}
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Top Toolbar / Dashboard Header */}
            <header className="h-16 shrink-0 bg-white border-b border-slate-100 px-8 flex items-center justify-between dark:border-slate-800 dark:bg-slate-900 transition-colors z-10">
              <div className="flex items-center gap-4">
                <span className="text-xl font-black text-sky-800 dark:text-sky-400">CliniMind</span>
                <span className="text-xs font-semibold text-slate-400 hidden md:inline">|</span>
                <span className="text-xs font-bold text-slate-500 hidden md:inline">{timeStr}</span>
              </div>

              {/* Top Bar Options (Theme, Language selector, Notification bell) */}
              <div className="flex items-center gap-3">
                {/* Light/Dark Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-700 transition-all hover:bg-slate-100 active:scale-95 dark:bg-slate-850 dark:text-slate-200 dark:hover:bg-slate-800"
                  title="تغيير المظهر"
                >
                  {darkMode ? (
                    <svg className="h-4.5 w-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                    </svg>
                  ) : (
                    <svg className="h-4.5 w-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                    </svg>
                  )}
                </button>

                {/* Multilingual Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowLangDropdown(!showLangDropdown)}
                    className="flex h-9 px-3 items-center gap-1.5 rounded-xl bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all dark:bg-slate-850 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <svg className="h-4.5 w-4.5 fill-none stroke-current stroke-2 text-slate-500" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <span>{lang === "ar" ? "العربية" : lang === "en" ? "EN" : "FR"}</span>
                  </button>

                  {showLangDropdown && (
                    <div className={`absolute top-11 z-30 w-32 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-800 ${isRTL ? "right-0" : "left-0"}`}>
                      <button
                        onClick={() => changeLanguage("ar")}
                        className="w-full text-start rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-750"
                      >
                        العربية
                      </button>
                      <button
                        onClick={() => changeLanguage("en")}
                        className="w-full text-start rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-750"
                      >
                        English
                      </button>
                      <button
                        onClick={() => changeLanguage("fr")}
                        className="w-full text-start rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-750"
                      >
                        Français
                      </button>
                    </div>
                  )}
                </div>

                {/* Notifications Bell icon */}
                <div className="relative">
                  <button
                    onClick={() => setShowBellDropdown(!showBellDropdown)}
                    className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-700 transition-all hover:bg-slate-100 active:scale-95 dark:bg-slate-850 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <svg className="h-4.5 w-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9m4.73 13a3 3 0 0 0 5.54 0" />
                    </svg>
                    {notifications.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
                    )}
                  </button>

                  {showBellDropdown && (
                    <div className={`absolute top-11 z-35 w-72 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-800 ${isRTL ? "left-0" : "right-0"}`}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{activeTrans.urgentNotifications}</span>
                        <button
                          onClick={() => setNotifications([])}
                          className="text-[10px] text-sky-600 hover:underline dark:text-sky-400"
                        >
                          {lang === "ar" ? "مسح الكل" : lang === "en" ? "Clear all" : "Tout effacer"}
                        </button>
                      </div>
                      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="py-4 text-center text-xs text-slate-400">لا توجد إشعارات حالياً</p>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={`rounded-xl p-2.5 text-xs transition-colors ${
                                notif.type === "critical"
                                  ? "bg-red-50 text-red-900 dark:bg-red-950/20 dark:text-red-300"
                                  : "bg-amber-50 text-amber-900 dark:bg-amber-950/20 dark:text-amber-300"
                              }`}
                            >
                              <div className="font-bold mb-0.5">{notif.title}</div>
                              <div className="opacity-90 leading-relaxed text-[11px]">{notif.description}</div>
                              <div className="mt-1 text-[9px] opacity-75">{notif.time}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Content viewport area */}
            <div className="flex-1 overflow-y-auto p-8">

              {/* A. DASHBOARD VIEW PAGE */}
              {activeTab === "dashboard" && (
                <div className="animate-fadeIn space-y-6">
                  <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{activeTrans.tabDashboard}</h2>

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
                        <h3 className="text-3xl font-black text-slate-850 dark:text-slate-50">18</h3>
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
                        <h3 className="text-2xl font-black text-slate-850 dark:text-slate-50">8,450 {activeTrans.currency}</h3>
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
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-extrabold text-red-700 dark:bg-red-950/30 dark:text-red-300">2 {activeTrans.newAlerts}</span>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">{activeTrans.urgentNotifications}</h3>
                      </div>

                      {/* Card 1 */}
                      <div className="flex gap-4 rounded-2xl border border-red-100 bg-red-50/30 p-4 dark:border-red-950/20 dark:bg-red-950/10">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
                          <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                            <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                            <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
                            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                          </svg>
                        </div>
                        <div className="flex-1 text-start">
                          <h4 className="text-xs font-bold text-red-800 dark:text-red-300">{activeTrans.statsCritical}</h4>
                          <p className="mt-1 text-[11px] leading-relaxed text-red-750 dark:text-red-400">
                            {activeTrans.potassiumAlert}
                          </p>
                          <span className="mt-1.5 block text-[10px] font-bold text-red-500">{activeTrans.tenMinsAgo}</span>
                        </div>
                      </div>

                      {/* Card 2 */}
                      <div className="flex gap-4 rounded-2xl border border-amber-100 bg-amber-50/20 p-4 dark:border-amber-950/20 dark:bg-amber-950/10">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200">
                          <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                            <rect x="2" y="2" width="20" height="20" rx="3" />
                            <line x1="2" y1="10" x2="22" y2="10" />
                          </svg>
                        </div>
                        <div className="flex-1 text-start">
                          <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">{activeTrans.lowStock}</h4>
                          <p className="mt-1 text-[11px] leading-relaxed text-amber-750 dark:text-amber-400">
                            {activeTrans.stockAlert}
                          </p>
                          <span className="mt-1.5 block text-[10px] text-amber-500">{activeTrans.oneHourAgo}</span>
                        </div>
                      </div>
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
                        <div className={`absolute top-2 rounded-xl bg-slate-900 border border-slate-800 py-1.5 px-3 text-[10px] font-bold text-sky-400 shadow-md ${isRTL ? "left-6" : "right-6"}`}>
                          {activeTrans.today}: 8,450 {activeTrans.currency}
                        </div>
                      </div>

                      {/* X Axis Labels */}
                      <div className="mt-4 flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500">
                        <span>{lang === "ar" ? "الأحد" : lang === "en" ? "Sun" : "Dim"}</span>
                        <span>{lang === "ar" ? "الإثنين" : lang === "en" ? "Mon" : "Lun"}</span>
                        <span>{lang === "ar" ? "الثلاثاء" : lang === "en" ? "Tue" : "Mar"}</span>
                        <span>{lang === "ar" ? "الأربعاء" : lang === "en" ? "Wed" : "Mer"}</span>
                        <span>{lang === "ar" ? "الخميس" : lang === "en" ? "Thu" : "Jeu"}</span>
                        <span>{lang === "ar" ? "الجمعة" : lang === "en" ? "Fri" : "Ven"}</span>
                        <span>{lang === "ar" ? "السبت" : lang === "en" ? "Sat" : "Sam"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* B. PATIENTS VIEW PAGE */}
              {activeTab === "patients" && (
                <div className="animate-fadeIn space-y-6">
                  <div className="flex items-center justify-between">
                    {/* Add Patient Button */}
                    <button
                      onClick={() => setShowAddPatientModal(true)}
                      className="flex items-center gap-2 rounded-2xl bg-sky-800 text-white px-4 py-2.5 text-xs font-bold shadow-md hover:bg-sky-700 active:scale-95 dark:bg-sky-600 dark:hover:bg-sky-500"
                    >
                      <svg className="h-4.5 w-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>{activeTrans.addPatient}</span>
                    </button>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{activeTrans.tabPatients}</h2>
                  </div>

                  {/* Search input with search icon */}
                  <div className="relative max-w-md text-start">
                    <input
                      type="text"
                      placeholder={activeTrans.searchPlaceholder}
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-400"
                    />
                    <div className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRTL ? "left-4" : "right-4"}`}>
                      <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                    </div>
                  </div>

                  {/* Patient List Cards Container */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPatients.length === 0 ? (
                      <div className="col-span-full rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        {activeTrans.noPatientsFound}
                      </div>
                    ) : (
                      filteredPatients.map((p) => (
                        <div
                          key={p.id}
                          className="group flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="flex items-start justify-between">
                            {/* Action Arrow Icon Button */}
                            <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-sky-50 group-hover:text-sky-700 dark:bg-slate-800 dark:group-hover:bg-slate-750 dark:group-hover:text-sky-400">
                              <svg className="h-4.5 w-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                                <path d="m15 18-6-6 6-6" />
                              </svg>
                            </button>

                            {/* Avatar & Patient Basic info */}
                            <div className="flex items-center gap-3.5 text-start">
                              <div className="text-end">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100">{p.fullName}</h3>
                                <span className="mt-1 inline-block font-mono text-xs text-slate-400 dark:text-slate-500">
                                  # {p.fileNumber}
                                </span>
                              </div>
                              
                              {/* Avatar display */}
                              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800">
                                {p.id === "1" ? (
                                  <svg className="h-9 w-9 text-slate-400 dark:text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4.5h-2V7h2v5z" />
                                  </svg>
                                ) : p.id === "2" ? (
                                  <svg className="h-9 w-9 text-slate-400 dark:text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                  </svg>
                                ) : (
                                  <svg className="h-7 w-7 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Contact & Date section */}
                          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2 dark:border-slate-800/80">
                            {/* Phone number */}
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{p.phonePrimary}</span>
                              <span className="flex items-center gap-1.5 text-slate-400">
                                {activeTrans.phoneLabel}
                                <svg className="h-3.5 w-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                              </span>
                            </div>

                            {/* Last Visit */}
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
              )}

              {/* C. SCHEDULE VIEW PAGE */}
              {activeTab === "schedule" && (
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
                  <div className="flex items-center gap-3 overflow-x-auto pb-1 max-w-xl">
                    {[15, 16, 17, 18, 19].map((dayNum) => {
                      const dayNames: { [key: number]: string } = {
                        15: lang === "ar" ? "الأحد" : lang === "en" ? "Sun" : "Dim",
                        16: lang === "ar" ? "الإثنين" : lang === "en" ? "Mon" : "Lun",
                        17: lang === "ar" ? "الثلاثاء" : lang === "en" ? "Tue" : "Mar",
                        18: lang === "ar" ? "الأربعاء" : lang === "en" ? "Wed" : "Mer",
                        19: lang === "ar" ? "الخميس" : lang === "en" ? "Thu" : "Jeu",
                      };
                      const isActive = scheduleActiveDay === dayNum;
                      return (
                        <button
                          key={dayNum}
                          onClick={() => setScheduleActiveDay(dayNum)}
                          className={`flex flex-col items-center justify-center min-w-[80px] rounded-2xl py-3 text-center transition-all cursor-pointer ${
                            isActive
                              ? "bg-sky-800 text-white shadow-md dark:bg-sky-600"
                              : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
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
                    
                    {/* Doctor Group 1 */}
                    <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                        <div className="h-10 w-10 rounded-full bg-teal-50 overflow-hidden relative dark:bg-slate-800">
                          <svg className="absolute bottom-0 left-1/2 h-9 w-9 -translate-x-1/2 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                        <div className="text-end">
                          <h4 className="font-bold text-slate-800 dark:text-slate-100">د. أحمد يوسف</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">{activeTrans.familyMedicine}</p>
                        </div>
                      </div>

                      {/* Timed Cards */}
                      <div className="space-y-3">
                        {/* Appt 1 */}
                        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-850 dark:border-slate-800">
                          <div className="flex items-start justify-between">
                            <div className="text-end">
                              <span className="text-[10px] font-bold text-slate-400">{appointments[0].timeSlot} ص</span>
                              <h4 className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{appointments[0].patientName}</h4>
                              <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                                {appointments[0].reason} • {appointments[0].room}
                              </p>
                            </div>
                            <button
                              onClick={() => cycleAppointmentStatus(appointments[0].id)}
                              className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                            >
                              {activeTrans.statusWaiting}
                            </button>
                          </div>
                        </div>

                        {/* Appt 2 */}
                        <div className="rounded-2xl border-2 border-sky-300 bg-sky-50/50 p-4 dark:border-sky-900 dark:bg-sky-950/10">
                          <div className="flex items-start justify-between">
                            <div className="text-end">
                              <span className="text-[10px] font-bold text-sky-850 dark:text-sky-400">{appointments[1].timeSlot} ص</span>
                              <h4 className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{appointments[1].patientName}</h4>
                              <p className="text-xs text-slate-650 mt-1 dark:text-slate-400">
                                {appointments[1].reason} • {appointments[1].room}
                              </p>
                            </div>
                            <button
                              onClick={() => cycleAppointmentStatus(appointments[1].id)}
                              className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800 dark:bg-sky-900 dark:text-sky-300"
                            >
                              {activeTrans.statusExam}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Doctor Group 2 */}
                    <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                        <div className="h-10 w-10 rounded-full bg-pink-50 overflow-hidden relative dark:bg-slate-800">
                          <svg className="absolute bottom-0 left-1/2 h-9 w-9 -translate-x-1/2 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                        <div className="text-end">
                          <h4 className="font-bold text-slate-800 dark:text-slate-100">د. سارة محمود</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">{activeTrans.cardiology}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Appt 3 */}
                        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-850 dark:border-slate-800">
                          <div className="flex items-start justify-between">
                            <div className="text-end">
                              <span className="text-[10px] font-bold text-slate-400">{appointments[2].timeSlot} ص</span>
                              <h4 className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{appointments[2].patientName}</h4>
                              <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                                {appointments[2].reason} • {appointments[2].room}
                              </p>
                            </div>
                            <button
                              onClick={() => cycleAppointmentStatus(appointments[2].id)}
                              className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700 dark:bg-teal-950/20 dark:text-teal-400"
                            >
                              {activeTrans.statusArrived}
                            </button>
                          </div>
                        </div>

                        {/* Appt 4 */}
                        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-850 dark:border-slate-800">
                          <div className="flex items-start justify-between">
                            <div className="text-end">
                              <span className="text-[10px] font-bold text-slate-400">01:00 م</span>
                              <h4 className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{appointments[3].patientName}</h4>
                              <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                                {appointments[3].reason} • {appointments[3].room}
                              </p>
                            </div>
                            <button
                              onClick={() => cycleAppointmentStatus(appointments[3].id)}
                              className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                            >
                              {activeTrans.statusConfirmed}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* D. MEDICAL VIEW PAGE */}
              {activeTab === "medical" && (
                <div className="animate-fadeIn space-y-6">
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{activeTrans.tabMedical}</h2>

                  {/* Sub tab selectors */}
                  <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800 max-w-sm">
                    <button
                      onClick={() => setMedicalActiveSubTab("pharmacy")}
                      className={`flex-1 rounded-xl py-2.5 text-center text-xs font-bold transition-all cursor-pointer ${
                        medicalActiveSubTab === "pharmacy"
                          ? "bg-white text-slate-850 shadow-sm dark:bg-slate-700 dark:text-white"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200"
                      }`}
                    >
                      {activeTrans.pharmacyStock}
                    </button>
                    <button
                      onClick={() => setMedicalActiveSubTab("lab")}
                      className={`flex-1 rounded-xl py-2.5 text-center text-xs font-bold transition-all cursor-pointer ${
                        medicalActiveSubTab === "lab"
                          ? "bg-white text-slate-850 shadow-sm dark:bg-slate-700 dark:text-white"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200"
                      }`}
                    >
                      {activeTrans.hospitalRequests}
                    </button>
                  </div>

                  {/* Sub tab 1: Lab Requests queue */}
                  {medicalActiveSubTab === "lab" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Urgent requests column */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-600 dark:bg-red-950/20">{activeTrans.autoUpdate}</span>
                          <h3 className="flex items-center gap-1.5 text-sm font-bold text-red-600">
                            {activeTrans.urgentCases}
                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                          </h3>
                        </div>

                        {labRequests.filter(req => req.priority === "urgent").map((req) => (
                          <div key={req.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-start">
                            <div className="flex items-start justify-between">
                              <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700 dark:bg-red-950/20 dark:text-red-400">
                                {lang === "ar" ? "عاجل جداً" : "Urgent"}
                              </span>
                              <div className="text-end">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100">{req.patientName}</h4>
                                <p className="text-[10px] text-slate-450 mt-0.5">{req.location}</p>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-850">
                              <span className="text-[10px] text-slate-400">{activeTrans.testType}:</span>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{req.testName}</span>
                            </div>

                            <div className="mt-4 flex gap-2">
                              {req.status === "pending" ? (
                                <>
                                  <button
                                    onClick={() => enterLabResult(req.id)}
                                    className="flex-1 rounded-xl bg-sky-800 py-2 text-xs font-bold text-white shadow-md hover:bg-sky-700 dark:bg-sky-600"
                                  >
                                    {activeTrans.enterResults}
                                  </button>
                                  <button
                                    onClick={() => startLabAnalysis(req.id)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                  >
                                    {activeTrans.details}
                                  </button>
                                </>
                              ) : req.status === "in_progress" ? (
                                <button
                                  onClick={() => enterLabResult(req.id)}
                                  className="w-full rounded-xl bg-amber-500 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-600"
                                >
                                  {activeTrans.enterResults}
                                </button>
                              ) : (
                                <div className="w-full text-center py-2 bg-green-50 rounded-xl text-green-700 text-xs font-bold dark:bg-green-950/20 dark:text-green-400">
                                  ✓ {activeTrans.testCompleted}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Routine requests column */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400">{activeTrans.autoUpdate}</span>
                          <h3 className="flex items-center gap-1.5 text-sm font-bold text-sky-800 dark:text-sky-400">
                            {activeTrans.routineRequests}
                            <span className="h-2 w-2 rounded-full bg-sky-500"></span>
                          </h3>
                        </div>

                        {labRequests.filter(req => req.priority === "normal").map((req) => (
                          <div key={req.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-start">
                            <div className="flex items-start justify-between">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-850 dark:text-slate-400">
                                {lang === "ar" ? "ساعتين" : "2 Hours"}
                              </span>
                              <div className="text-end">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100">{req.patientName}</h4>
                                <p className="text-[10px] text-slate-450 mt-0.5">{req.location}</p>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-850">
                              <span className="text-[10px] text-slate-400">{activeTrans.testType}:</span>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{req.testName}</span>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400">{req.time}</span>
                              {req.status === "pending" ? (
                                <button
                                  onClick={() => startLabAnalysis(req.id)}
                                  className="rounded-xl border border-sky-800 px-4 py-1.5 text-xs font-bold text-sky-800 hover:bg-sky-50 dark:border-sky-400 dark:text-sky-400 dark:hover:bg-slate-800"
                                >
                                  {activeTrans.startTest}
                                </button>
                              ) : req.status === "in_progress" ? (
                                <button
                                  onClick={() => enterLabResult(req.id)}
                                  className="rounded-xl bg-sky-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-700 dark:bg-sky-600"
                                >
                                  {activeTrans.enterResults}
                                </button>
                              ) : (
                                <span className="text-xs font-bold text-green-600 dark:text-green-400">تم الانتهاء</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sub tab 2: Pharmacy Inventory table */}
                  {medicalActiveSubTab === "pharmacy" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                        <span className="text-xs text-slate-500">{activeTrans.stockStatus}</span>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">{activeTrans.emergencyStock}</h3>
                      </div>

                      <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <table className="w-full text-start border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-450 dark:bg-slate-850 dark:border-slate-800 text-start">
                              <th className="p-4 text-start">{lang === "ar" ? "الاسم التجاري" : "Name"}</th>
                              <th className="p-4 text-start">{lang === "ar" ? "الاسم العلمي" : "Scientific Name"}</th>
                              <th className="p-4 text-start">{lang === "ar" ? "الكمية المتوفرة" : "Stock"}</th>
                              <th className="p-4 text-start">{lang === "ar" ? "حالة المخزون" : "Status"}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {pharmacyInventory.map((item) => {
                              const isLow = item.stock < item.minThreshold;
                              return (
                                <tr key={item.id} className="text-xs hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                                  <td className="p-4 font-bold text-slate-800 dark:text-slate-100 text-start">{item.name}</td>
                                  <td className="p-4 font-mono text-slate-450 text-start">{item.scientificName}</td>
                                  <td className="p-4 font-bold text-start">{item.stock} {item.unit}</td>
                                  <td className="p-4 text-start">
                                    {isLow ? (
                                      <span className="inline-block rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-600 dark:bg-red-950/20">
                                        {activeTrans.lowStock}
                                      </span>
                                    ) : (
                                      <span className="inline-block rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-bold text-green-700 dark:bg-green-950/20">
                                        ✓ كافٍ
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: ADD PATIENT (Dashboard layout integration) */}
      {showAddPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 animate-fadeIn">
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setShowAddPatientModal(false)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">{activeTrans.addPatientTitle}</h3>
            </div>

            <form onSubmit={handleAddPatient} className="space-y-4">
              <div className="text-start">
                <label className="text-[11px] font-bold text-slate-400 uppercase">{activeTrans.fullNameLabel}</label>
                <input
                  type="text"
                  required
                  placeholder="أدخل اسم المريض..."
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="text-start">
                <label className="text-[11px] font-bold text-slate-400 uppercase">{activeTrans.phoneLabel}</label>
                <input
                  type="tel"
                  required
                  placeholder="050-000-0000"
                  value={newPatientPhone}
                  onChange={(e) => setNewPatientPhone(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-start">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">{activeTrans.ageCategoryLabel}</label>
                  <select
                    value={newPatientAgeCat}
                    onChange={(e) => setNewPatientAgeCat(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
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
                      onClick={() => setNewPatientGender("F")}
                      className={`flex-1 rounded-xl py-2 text-center text-xs font-bold transition-all ${
                        newPatientGender === "F"
                          ? "bg-pink-100 text-pink-700 ring-2 ring-pink-300 dark:bg-pink-950/40 dark:text-pink-400"
                          : "bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-800"
                      }`}
                    >
                      {activeTrans.genderFemale}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPatientGender("M")}
                      className={`flex-1 rounded-xl py-2 text-center text-xs font-bold transition-all ${
                        newPatientGender === "M"
                          ? "bg-sky-100 text-sky-700 ring-2 ring-sky-300 dark:bg-sky-950/40 dark:text-sky-400"
                          : "bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-800"
                      }`}
                    >
                      {activeTrans.genderMale}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-sky-800 py-3.5 text-xs font-bold text-white shadow-md hover:bg-sky-700 dark:bg-sky-600"
                >
                  {activeTrans.savePatient}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global CSS Transition styling */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
