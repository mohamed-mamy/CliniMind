import { useState, useEffect } from 'react';
import { notifStore, UrgentNotification } from '../store/notifStore';

export function useNotifications() {
  const [notifications, setNotificationsState] = useState<UrgentNotification[]>(notifStore.getNotifications());

  useEffect(() => {
    setNotificationsState(notifStore.getNotifications());

    const unsubscribe = notifStore.subscribe(() => {
      setNotificationsState(notifStore.getNotifications());
    });

    return unsubscribe;
  }, []);

  return {
    notifications,
    clearAll: () => notifStore.clearAll(),
    addNotification: (notif: UrgentNotification) => notifStore.addNotification(notif),
    setNotifications: (list: UrgentNotification[]) => notifStore.setNotifications(list),
  };
}
