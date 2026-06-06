export interface UrgentNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'critical' | 'warning';
}

let notificationList: UrgentNotification[] = [];

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
