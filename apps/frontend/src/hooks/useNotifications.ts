import { useState, useEffect } from 'react';
import { notifStore, UrgentNotification } from '../store/notifStore';

export function useNotifications() {
  const [notifications, setNotificationsState] = useState<UrgentNotification[]>(notifStore.getNotifications());
  const [unreadCount, setUnreadCount] = useState<number>(notifStore.getUnreadCount());

  useEffect(() => {
    setNotificationsState(notifStore.getNotifications());
    setUnreadCount(notifStore.getUnreadCount());

    const unsubscribe = notifStore.subscribe(() => {
      setNotificationsState(notifStore.getNotifications());
      setUnreadCount(notifStore.getUnreadCount());
    });

    return unsubscribe;
  }, []);

  return {
    notifications,
    unreadCount,
    clearAll: () => notifStore.clearAll(),
    addNotification: (notif: UrgentNotification) => notifStore.addNotification(notif),
    setNotifications: (list: UrgentNotification[]) => notifStore.setNotifications(list),
    mergeNotifications: (list: UrgentNotification[]) => notifStore.mergeNotifications(list),
    markRead: (id: string) => notifStore.markRead(id),
    markAllRead: () => notifStore.markAllRead(),
  };
}
