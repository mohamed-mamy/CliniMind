import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';
import { useSocket } from './hooks/useSocket';
import { api } from './services/api';
import { notifStore } from './store/notifStore';
import { authStore } from './store/authStore';
import { t, LangKey } from './services/localization';

// Import Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Laboratory from './pages/Laboratory';
import Billing from './pages/Billing';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  const { isLoggedIn, user, lang, setLang, darkMode, setDarkMode, setAuth } = useAuth();
  const { notifications, clearAll } = useNotifications();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showBellDropdown, setShowBellDropdown] = useState<boolean>(false);
  const [showLangDropdown, setShowLangDropdown] = useState<boolean>(false);
  const [timeStr, setTimeStr] = useState<string>('00:00');
  const [clinicName, setClinicName] = useState<string>(authStore.getClinicName());

  // Connect socket on login
  useSocket();

  // Fetch settings and persisted critical notifications on login
  useEffect(() => {
    if (isLoggedIn) {
      api.getSettings().then(res => {
        if (res.success && res.data?.clinicName) {
          authStore.setClinicName(res.data.clinicName);
        }
      }).catch(() => {});

      api.getCriticalLabResults().then(res => {
        if (res.success && res.data.length > 0) {
          const items = res.data.map((r: any) => ({
            id: `critical-api-${r.id}`,
            title: 'نتيجة حرجة / Résultat critique',
            description: r.patientName ? `نتيجة حرجة للمريض: ${r.patientName}` : 'نتيجة حرجة',
            time: r.completedAt ? new Date(r.completedAt).toLocaleString('ar-SA') : '',
            type: 'critical' as const,
          }));
          items.forEach((item: any) => notifStore.addNotification(item));
        }
      });
    }
  }, [isLoggedIn]);

  const activeTrans = t[lang];
  const isRTL = activeTrans.dir === 'rtl';

  // Sync clinicName from authStore reactively and update document title
  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      setClinicName(authStore.getClinicName());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    document.title = clinicName;
  }, [clinicName]);

  // Dynamic Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${hrs}:${mins}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  // Reset tab to dashboard on login or role change to match allowed tabs
  useEffect(() => {
    if (isLoggedIn && user) {
      // Find first allowed tab for the user
      const allowed = getTabsForRole(user.role);
      if (allowed.length > 0 && !allowed.find(tab => tab.id === activeTab)) {
        setActiveTab(allowed[0].id);
      }
    }
  }, [isLoggedIn, user]);

  // Listen for navigation events from child components (e.g. Dashboard quick actions)
  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent).detail;
      if (tab) setActiveTab(tab);
    };
    window.addEventListener('app-navigate', handler);
    return () => window.removeEventListener('app-navigate', handler);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const changeLanguage = (newLang: LangKey) => {
    setLang(newLang);
    setShowLangDropdown(false);
  };

  const handleLogout = () => {
    setAuth(null);
    setActiveTab('dashboard');
  };

  // RBAC Tab Configurations
  function getTabsForRole(role: 'director' | 'doctor' | 'receptionist' | 'lab_technician') {
    const allTabs = [
      { id: 'dashboard', label: activeTrans.tabDashboard, roles: ['director', 'doctor', 'receptionist'] },
      { id: 'patients', label: activeTrans.tabPatients, roles: ['director', 'doctor', 'receptionist'] },
      { id: 'appointments', label: activeTrans.tabSchedule, roles: ['director', 'doctor', 'receptionist'] },
      { id: 'laboratory', label: activeTrans.hospitalRequests, roles: ['director', 'doctor', 'lab_technician'] },
      { id: 'billing', label: activeTrans.tabBilling, roles: ['director', 'receptionist'] },
      { id: 'expenses', label: activeTrans.tabExpenses, roles: ['director'] },
      { id: 'reports', label: activeTrans.tabReports, roles: ['director'] },
      { id: 'settings', label: activeTrans.tabSettings, roles: ['director'] },
    ];

    return allTabs.filter(tab => tab.roles.includes(role));
  }

  // If not logged in, render the standalone Login screen
  if (!isLoggedIn || !user) {
    return <Login />;
  }

  const allowedTabs = getTabsForRole(user.role);

  return (
    <div
      dir={activeTrans.dir}
      className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-300 bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-200`}
    >
      <div className="flex-1 w-full flex h-screen overflow-hidden">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-64 bg-white border-slate-100 flex flex-col justify-between shrink-0 z-20 shadow-sm border-e dark:border-slate-800 dark:bg-slate-900 transition-colors">
          <div className="flex flex-col overflow-y-auto">
            {/* Profile Card Section */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 text-center flex flex-col items-center gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-sky-100 bg-sky-50 dark:border-sky-950 dark:bg-slate-800 shadow-inner">
                <svg className="absolute bottom-0 left-1/2 h-14 w-14 -translate-x-1/2 text-sky-600 dark:text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {user.fullName}
                </h3>
                <p className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 mt-0.5">
                  {user.role === 'director' ? activeTrans.clinicDirector : user.role}
                </p>
              </div>
            </div>

            {/* Navigation Tabs Menu */}
            <nav className="p-4 space-y-1.5 flex-1">
              {allowedTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                
                // Dynamic icons for each tab
                const getIcon = (id: string) => {
                  switch (id) {
                    case 'dashboard':
                      return (
                        <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                        </svg>
                      );
                    case 'patients':
                      return (
                        <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      );
                    case 'appointments':
                      return (
                        <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      );
                    case 'laboratory':
                      return (
                        <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                          <path d="M6 3h12M12 3v15M10 18h4M8 21h8" />
                          <path d="M9 13a3 3 0 0 1 6 0v5H9v-5Z" />
                        </svg>
                      );
                    case 'billing':
                      return (
                        <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <line x1="12" y1="4" x2="12" y2="20" />
                        </svg>
                      );
                    case 'expenses':
                      return (
                        <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                      );
                    case 'reports':
                      return (
                        <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                          <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                          <path d="M22 12A10 10 0 0 0 12 2v10z" />
                        </svg>
                      );
                    case 'settings':
                      return (
                        <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                      );
                    default:
                      return null;
                  }
                };

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-sky-50 text-sky-850 dark:bg-sky-950/40 dark:text-sky-400'
                        : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {getIcon(tab.id)}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Logout button at the bottom of sidebar */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all active:scale-98 cursor-pointer"
            >
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
              <span className="text-xl font-black text-sky-850 dark:text-sky-400">{clinicName}</span>
              <span className="text-xs font-semibold text-slate-400 hidden md:inline">|</span>
              <span className="text-xs font-bold text-slate-500 hidden md:inline">{timeStr}</span>
            </div>

            {/* Top Bar Options */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleDarkMode}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-700 transition-all hover:bg-slate-100 active:scale-95 dark:bg-slate-850 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
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

              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="flex h-9 px-3 items-center gap-1.5 rounded-xl bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all dark:bg-slate-850 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <svg className="h-4.5 w-4.5 fill-none stroke-current stroke-2 text-slate-500" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span>{lang === 'ar' ? 'العربية' : lang === 'en' ? 'EN' : 'FR'}</span>
                </button>

                {showLangDropdown && (
                  <div className={`absolute top-11 z-30 w-32 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-800 ${isRTL ? 'right-0' : 'left-0'}`}>
                    <button
                      onClick={() => changeLanguage('ar')}
                      className="w-full text-start rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer"
                    >
                      العربية
                    </button>
                    <button
                      onClick={() => changeLanguage('en')}
                      className="w-full text-start rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer"
                    >
                      English
                    </button>
                    <button
                      onClick={() => changeLanguage('fr')}
                      className="w-full text-start rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer"
                    >
                      Français
                    </button>
                  </div>
                )}
              </div>

              {/* Notifications Bell Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowBellDropdown(!showBellDropdown)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-700 transition-all hover:bg-slate-100 active:scale-95 dark:bg-slate-850 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <svg className="h-4.5 w-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9m4.73 13a3 3 0 0 0 5.54 0" />
                  </svg>
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
                  )}
                </button>

                {showBellDropdown && (
                  <div className={`absolute top-11 z-35 w-72 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-800 ${isRTL ? 'left-0' : 'right-0'}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{activeTrans.urgentNotifications}</span>
                      <button
                        onClick={clearAll}
                        className="text-[10px] text-sky-650 hover:underline dark:text-sky-400 cursor-pointer"
                      >
                        {lang === 'ar' ? 'مسح الكل' : lang === 'en' ? 'Clear all' : 'Tout effacer'}
                      </button>
                    </div>
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="py-4 text-center text-xs text-slate-400">لا توجد إشعارات حالياً</p>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`rounded-xl p-2.5 text-xs transition-colors text-start ${
                              notif.type === 'critical'
                                ? 'bg-red-50 text-red-900 dark:bg-red-950/20 dark:text-red-300'
                                : 'bg-amber-50 text-amber-900 dark:bg-amber-950/20 dark:text-amber-300'
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
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'patients' && <Patients />}
            {activeTab === 'appointments' && <Appointments />}
            {activeTab === 'laboratory' && <Laboratory />}
            {activeTab === 'billing' && <Billing />}
            {activeTab === 'expenses' && <Expenses />}
            {activeTab === 'reports' && <Reports />}
            {activeTab === 'settings' && <Settings />}
          </div>
        </div>
      </div>
    </div>
  );
}
