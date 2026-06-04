export interface UrgentNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'critical' | 'warning';
}

let notificationList: UrgentNotification[] = [
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
];

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(l => l());
}

export const notifStore = {
  getNotifications: () => notificationList,
  setNotifications: (list: UrgentNotification[]) => {
    notificationList = list;
    emit();
  },
  clearAll: () => {
    notificationList = [];
    emit();
  },
  addNotification: (notif: UrgentNotification) => {
    notificationList = [notif, ...notificationList];
    emit();
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};
