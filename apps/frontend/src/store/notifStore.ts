export interface UrgentNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'critical' | 'warning';
  isRead?: boolean;
}

let notificationList: UrgentNotification[] = [];

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(l => l());
}

export const notifStore = {
  getNotifications: () => notificationList,

  getUnreadCount: () => notificationList.filter(n => !n.isRead).length,

  /** Replace entire list (used on initial load from API) */
  setNotifications: (list: UrgentNotification[]) => {
    notificationList = list;
    emit();
  },

  clearAll: () => {
    notificationList = [];
    emit();
  },

  /** Prepend a new notification, deduplicating by id */
  addNotification: (notif: UrgentNotification) => {
    if (notificationList.some(n => n.id === notif.id)) return; // skip duplicate
    notificationList = [notif, ...notificationList];
    emit();
  },

  /** Merge notifications from API without removing real-time ones */
  mergeNotifications: (incoming: UrgentNotification[]) => {
    const existingIds = new Set(notificationList.map(n => n.id));
    const newOnes = incoming.filter(n => !existingIds.has(n.id));
    if (newOnes.length > 0) {
      // Merge and sort by time descending (newest first)
      notificationList = [...notificationList, ...newOnes].sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );
      emit();
    }
  },

  markRead: (id: string) => {
    notificationList = notificationList.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    );
    emit();
  },

  markAllRead: () => {
    notificationList = notificationList.map(n => ({ ...n, isRead: true }));
    emit();
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};
