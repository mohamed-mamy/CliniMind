import { useEffect, useState } from 'react';
import { socketService } from '../services/socket';
import { notifStore } from '../store/notifStore';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = socketService.createConnection();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Lab events
    socket.on('lab:new_request', (data: any) => {
      console.log('[Socket] New lab request received:', data);
      notifStore.addNotification({
        id: `request-${data?._id || Date.now()}`,
        title: 'طلب تحليل جديد / Demande d\'analyse',
        description: `تم استلام طلب تحليل جديد للمريض.`,
        time: new Date().toLocaleTimeString('ar-SA'),
        type: 'warning',
      });
    });

    socket.on('lab:critical_result', (data: any) => {
      console.log('[Socket] Critical result received:', data);
      notifStore.addNotification({
        id: `critical-${data?._id || Date.now()}`,
        title: 'نتيجة حرجة / Résultat critique',
        description: data?.patientName
          ? `نتيجة حرجة للمريض: ${data.patientName}`
          : 'تم اكتشاف نتيجة حرجة في المختبر',
        time: new Date().toLocaleString('ar-SA'),
        type: 'critical',
      });
    });

    socket.on('notification:new', (data: any) => {
      console.log('[Socket] New notification:', data);
      notifStore.addNotification({
        id: `notif-${data?._id || Date.now()}`,
        title: data?.title || 'إشعار جديد',
        description: data?.body || '',
        time: new Date().toLocaleString('ar-SA'),
        type: data?.type === 'critical_result' ? 'critical' : 'warning',
      });
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('lab:new_request');
      socket.off('lab:critical_result');
      socket.off('notification:new');
    };
  }, []);

  return { isConnected, socket: socketService.getSocket() };
}