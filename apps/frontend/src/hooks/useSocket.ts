import { useEffect, useState } from 'react';
import { socketService } from '../services/socket';
import { notifStore } from '../store/notifStore';
import { authStore } from '../store/authStore';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const accessToken = authStore.getAccessToken();

  useEffect(() => {
    // Disconnect stale socket before reconnecting with new token
    socketService.disconnect();
    const socket = socketService.createConnection();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Lab events
    socket.on('lab:new_request', (data: any) => {
      const patientName = data?.patientId?.fullName || data?.patientName;
      notifStore.addNotification({
        id: `lab-request-${data?._id || Date.now()}`,
        title: 'طلب فحص جديد / Nouvelle demande d\'analyse',
        description: patientName
          ? `طلب فحص للمريض: ${patientName}`
          : 'تم استلام طلب فحص مختبر جديد',
        time: new Date().toLocaleString('ar-SA'),
        type: 'warning',
      });
    });

    socket.on('lab:critical_result', (data: any) => {
      const patientName = data?.patientId?.fullName || data?.patientName;
      notifStore.addNotification({
        id: `critical-${data?._id || Date.now()}`,
        title: 'نتيجة حرجة / Résultat critique',
        description: patientName
          ? `نتيجة حرجة للمريض: ${patientName}`
          : 'تم اكتشاف نتيجة حرجة في المختبر',
        time: new Date().toLocaleString('ar-SA'),
        type: 'critical',
      });
    });

    // General notification event (covers: new_lab_request, results_ready, critical_result,
    // new_appointment, consultation_end, next_patient, appointment:reminder)
    socket.on('notification:new', (data: any) => {
      console.log('[Socket] New notification:', data);
      const isCritical =
        data?.type === 'critical_result' || data?.type === 'critical';
      notifStore.addNotification({
        id: `notif-${data?._id || Date.now()}`,
        title: data?.title || 'إشعار جديد',
        description: data?.body || '',
        time: new Date().toLocaleString('ar-SA'),
        type: isCritical ? 'critical' : 'warning',
      });
    });

    // Appointment reminder event (emitted by backend appointment:reminder)
    socket.on('appointment:reminder', (data: any) => {
      const patientName = data?.patientName || data?.patientId?.fullName;
      notifStore.addNotification({
        id: `appt-reminder-${data?._id || Date.now()}`,
        title: 'تذكير موعد / Rappel RDV',
        description: patientName
          ? `موعد قادم مع: ${patientName}`
          : 'لديك موعد قادم قريباً',
        time: new Date().toLocaleString('ar-SA'),
        type: 'warning',
      });
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('lab:new_request');
      socket.off('lab:critical_result');
      socket.off('notification:new');
      socket.off('appointment:reminder');
      socketService.disconnect();
    };
  }, [accessToken]);

  return { isConnected, socket: socketService.getSocket() };
}