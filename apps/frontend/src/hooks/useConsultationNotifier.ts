import { useEffect, useRef } from 'react';
import { authStore } from '../store/authStore';
import { notifStore } from '../store/notifStore';
import { api, Appointment } from '../services/api';

const NOTIFIED_CONSULTATIONS_KEY = 'notified_consultations';
const NOTIFIED_NEXT_PATIENT_KEY = 'notified_next_patient';

function getNotifiedSet(key: string): Set<string> {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function addNotified(key: string, id: string) {
  const set = getNotifiedSet(key);
  set.add(id);
  sessionStorage.setItem(key, JSON.stringify([...set]));
}

/**
 * Converts an appointment's date + timeSlot into a Date object.
 * appointment.date may come as ISO string "2026-06-08T00:00:00.000Z" or "2026-06-08"
 */
function toAppointmentDate(dateStr: string, timeSlot: string): Date {
  // Take only the date part (YYYY-MM-DD) to avoid timezone issues
  const datePart = dateStr.substring(0, 10);
  return new Date(`${datePart}T${timeSlot}:00`);
}

export function useConsultationNotifier() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const user = authStore.getAuth();
    if (!user || user.role !== 'doctor') return;

    const check = async () => {
      try {
        // Fetch today's appointments (all active statuses for the doctor)
        const today = new Date().toISOString().substring(0, 10);
        const res = await api.getAppointments({ from: today, to: today });
        if (!res.success || !res.data) return;

        const now = new Date();
        const notifiedConsultations = getNotifiedSet(NOTIFIED_CONSULTATIONS_KEY);

        // Active appointments = not cancelled/no_show
        const activeToday: Appointment[] = res.data.filter(
          (a) => a.status !== 'cancelled' && a.status !== 'no_show'
        );

        // ---- 1. Consultation-end notifications ----
        for (const appt of activeToday) {
          if (!appt.date || !appt.timeSlot) continue;
          if (notifiedConsultations.has(appt.id)) continue;

          const startTime = toAppointmentDate(appt.date, appt.timeSlot);
          const durationMs = (appt.duration || 15) * 60_000;
          const endTime = new Date(startTime.getTime() + durationMs);

          // Fire when consultation time has passed but appointment is not yet completed
          if (now >= endTime && appt.status !== 'completed') {
            addNotified(NOTIFIED_CONSULTATIONS_KEY, appt.id);
            notifStore.addNotification({
              id: `consult-end-${appt.id}`,
              title: '⏰ انتهت مدة الاستشارة',
              description: `انتهت مدة استشارة المريض: ${appt.patientName}`,
              time: now.toLocaleString('ar-SA'),
              type: 'warning',
            });
          }
        }

        // ---- 2. Next-patient notification ----
        // Find who is currently in consultation (started but not ended yet)
        const inConsultation = activeToday.filter((a) => {
          if (!a.date || !a.timeSlot) return false;
          const start = toAppointmentDate(a.date, a.timeSlot);
          const end = new Date(start.getTime() + (a.duration || 15) * 60_000);
          return now >= start && now < end;
        });

        if (inConsultation.length > 0) {
          // Sort remaining appointments by timeSlot to find who's next
          const remaining = activeToday
            .filter((a) => {
              if (!a.date || !a.timeSlot) return false;
              const start = toAppointmentDate(a.date, a.timeSlot);
              return now < start; // hasn't started yet
            })
            .sort((a, b) => {
              const startA = toAppointmentDate(a.date, a.timeSlot).getTime();
              const startB = toAppointmentDate(b.date, b.timeSlot).getTime();
              // Prefer waitingRoomPosition when available, fall back to timeSlot
              if (a.waitingRoomPosition != null && b.waitingRoomPosition != null) {
                return a.waitingRoomPosition - b.waitingRoomPosition;
              }
              return startA - startB;
            });

          if (remaining.length > 0) {
            const nextPatient = remaining[0];
            const notifiedNext = getNotifiedSet(NOTIFIED_NEXT_PATIENT_KEY);

            if (!notifiedNext.has(nextPatient.id)) {
              addNotified(NOTIFIED_NEXT_PATIENT_KEY, nextPatient.id);
              notifStore.addNotification({
                id: `next-patient-${nextPatient.id}`,
                title: '👤 المريض التالي',
                description: `المريض التالي في الانتظار: ${nextPatient.patientName} (${nextPatient.timeSlot})`,
                time: now.toLocaleString('ar-SA'),
                type: 'warning',
              });
            }
          }
        }
      } catch {
        // Silently fail – network errors should not crash the UI
      }
    };

    // Initial check after 5 s, then every 60 s
    const initialTimeout = setTimeout(check, 5000);
    intervalRef.current = setInterval(check, 60_000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}
