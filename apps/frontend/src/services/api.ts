import axios, { AxiosRequestHeaders } from 'axios';
import { authStore } from '../store/authStore';

axios.interceptors.response.use(
  response => response,
  error => {
    if (error?.response?.status === 401 && authStore.getAuth()) {
      authStore.setAuth(null);
    }

    return Promise.reject(error);
  },
);

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
  } | null;
}

export interface Patient {
  id: string;
  fullName: string;
  fileNumber: string;
  phonePrimary: string;
  lastVisit: string;
  ageCategory: string;
  gender: 'M' | 'F';
  bloodType?: string;
  allergies?: { type: string; description: string }[];
  chronicDiseases?: string[];
  confidentialNotes?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  date: string;
  timeSlot: string;
  duration: number;
  reason: string;
  type: 'normal' | 'followup' | 'emergency' | 'checkup';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  waitingRoomPosition: number | null;
  createdAt: string;
}

export interface LabResult {
  testName: string;
  resultText?: string;
  resultNumeric?: number;
  unit?: string;
  normalRange?: string;
  attachmentUrl?: string;
}

export interface LabRequest {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName?: string;
  tests: string[];
  priority: 'normal' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  isCritical: boolean;
  results: LabResult[];
  requestedAt: string;
  completedAt?: string;
  createdAt?: string;
}

export interface Expense {
  id: string;
  category: 'salary' | 'rent' | 'utilities' | 'supplies' | 'maintenance' | 'other';
  amount: number;
  description: string;
  date: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'paid' | 'unpaid' | 'partial';
  createdAt: string;
}

function authHeaders(): AxiosRequestHeaders {
  const token = authStore.getAccessToken();
  if (token) {
    return { Authorization: `Bearer ${token}` } as AxiosRequestHeaders;
  }
  return {} as AxiosRequestHeaders;
}

function mapPatient(p: any): Patient {
  return {
    id: p._id,
    fullName: p.fullName,
    fileNumber: String(p.fileNumber),
    phonePrimary: p.phonePrimary,
    lastVisit: p.updatedAt || p.createdAt || '',
    ageCategory: p.ageCategory,
    gender: p.gender,
    bloodType: p.bloodType,
    allergies: p.medicalHistory?.allergies || p.allergies,
    chronicDiseases: p.medicalHistory?.chronicDiseases || p.chronicDiseases,
    confidentialNotes: p.medicalHistory?.confidentialNotes || p.confidentialNotes,
  };
}

function mapAppointment(a: any): Appointment {
  return {
    id: a._id,
    patientId: a.patientId?._id || a.patientId,
    patientName: a.patientName || a.patientId?.fullName || '',
    patientPhone: a.patientPhone || a.patientId?.phonePrimary,
    doctorId: a.doctorId?._id || a.doctorId,
    doctorName: a.doctorName || a.doctorId?.fullName || '',
    date: a.date,
    timeSlot: a.timeSlot,
    duration: a.duration || 15,
    reason: a.reason || '',
    type: a.type || 'normal',
    status: a.status,
    waitingRoomPosition: a.waitingRoomPosition ?? null,
    createdAt: a.createdAt,
  };
}

function mapLabRequest(r: any): LabRequest {
  return {
    id: r._id,
    patientId: r.patientId?._id || r.patientId || '',
    patientName: r.patientId?.fullName || r.patientName || '',
    doctorId: r.doctorId?._id || r.doctorId || '',
    doctorName: r.doctorId?.fullName || r.doctorName || '',
    tests: r.tests || [],
    priority: r.priority,
    status: r.status,
    isCritical: r.isCritical || false,
    results: r.results || [],
    requestedAt: r.requestedAt || r.createdAt || '',
    completedAt: r.completedAt || undefined,
    createdAt: r.createdAt || '',
  };
}

function mapExpense(e: any): Expense {
  return {
    id: e._id,
    category: e.category,
    amount: e.amount,
    description: e.description,
    date: e.date ? e.date.substring(0, 10) : '',
  };
}

function mapInvoice(i: any): Invoice {
  return {
    id: i._id,
    invoiceNumber: String(i.invoiceNumber),
    patientName: i.patientName,
    totalAmount: i.totalAmount,
    paidAmount: i.paidAmount,
    remainingAmount: i.remainingAmount,
    status: i.status,
    createdAt: i.createdAt ? i.createdAt.substring(0, 10) : '',
  };
}

export interface ClinicSettings {
  clinicName: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  logoUrl?: string;
  defaultConsultationFee?: number;
  smtpConfig?: { host?: string; port?: number; smtpUser?: string; smtpPass?: string };
  criticalThresholds?: Record<string, { min: number; max: number; unit: string }>;
}

export interface UserDto {
  _id: string;
  fullName: string;
  role: string;
}

export const api = {
  getPatients: async (): Promise<ApiResponse<Patient[]>> => {
    const res = await axios.get('/v1/patients', { headers: authHeaders() });
    return { success: true, data: res.data.data.map(mapPatient), error: null, meta: res.data.meta };
  },

  createPatient: async (patient: Omit<Patient, 'id' | 'fileNumber' | 'lastVisit'>): Promise<ApiResponse<Patient>> => {
    const body: Record<string, any> = {
      fullName: patient.fullName,
      phonePrimary: patient.phonePrimary,
      gender: patient.gender,
      ageCategory: patient.ageCategory,
      bloodType: patient.bloodType,
    };
    if (patient.allergies?.length) body.allergies = patient.allergies;
    if (patient.chronicDiseases?.length) body.chronicDiseases = patient.chronicDiseases;
    if (patient.confidentialNotes) {
      body.medicalHistory = { confidentialNotes: patient.confidentialNotes };
    }
    const res = await axios.post('/v1/patients', body, { headers: authHeaders() });
    return { success: true, data: mapPatient(res.data.data), error: null };
  },

  deletePatient: async (id: string): Promise<ApiResponse<string>> => {
    await axios.delete(`/v1/patients/${id}`, { headers: authHeaders() });
    return { success: true, data: id, error: null };
  },

  getAppointments: async (params?: { from?: string; to?: string; doctorId?: string; status?: string }): Promise<ApiResponse<Appointment[]>> => {
    const res = await axios.get('/v1/appointments', { headers: authHeaders(), params });
    return { success: true, data: res.data.data.map(mapAppointment), error: null, meta: res.data.meta };
  },

  getUsers: async (params?: { role?: string }): Promise<ApiResponse<UserDto[]>> => {
    const res = await axios.get('/v1/users', { headers: authHeaders(), params });
    return { success: true, data: res.data.data, error: null };
  },

  createAppointment: async (data: { patientId: string; doctorId: string; date: string; timeSlot: string; reason?: string; type?: string; duration?: number }): Promise<ApiResponse<Appointment>> => {
    const res = await axios.post('/v1/appointments', data, { headers: authHeaders() });
    return { success: true, data: mapAppointment(res.data.data), error: null };
  },

  updateAppointmentStatus: async (id: string, status: Appointment['status']): Promise<ApiResponse<Appointment>> => {
    const res = await axios.put(`/v1/appointments/${id}/status`, { status }, { headers: authHeaders() });
    return { success: true, data: mapAppointment(res.data.data), error: null };
  },

  getLabRequests: async (params?: { status?: string; priority?: string; patientId?: string }): Promise<ApiResponse<LabRequest[]>> => {
    const res = await axios.get('/v1/lab/requests', { headers: authHeaders(), params });
    return { success: true, data: (res.data.data || []).map(mapLabRequest), error: null, meta: res.data.meta };
  },

  getPendingLabRequests: async (): Promise<ApiResponse<LabRequest[]>> => {
    const res = await axios.get('/v1/lab/requests/pending', { headers: authHeaders() });
    return { success: true, data: (res.data.data || []).map(mapLabRequest), error: null, meta: res.data.meta };
  },

  getLabRequestById: async (id: string): Promise<ApiResponse<LabRequest>> => {
    const res = await axios.get(`/v1/lab/requests/${id}`, { headers: authHeaders() });
    return { success: true, data: mapLabRequest(res.data.data), error: null };
  },

  createLabRequest: async (data: { patientId: string; tests: string[]; priority?: 'normal' | 'urgent' }): Promise<ApiResponse<LabRequest>> => {
    const res = await axios.post('/v1/lab/requests', data, { headers: authHeaders() });
    return { success: true, data: mapLabRequest(res.data.data), error: null };
  },

  updateLabRequestStatus: async (id: string, status: LabRequest['status']): Promise<ApiResponse<LabRequest>> => {
    const res = await axios.put(`/v1/lab/requests/${id}/status`, { status }, { headers: authHeaders() });
    return { success: true, data: mapLabRequest(res.data.data), error: null };
  },

  enterLabResults: async (id: string, results: LabResult[]): Promise<ApiResponse<{ labRequest: LabRequest; criticalResults: string[] }>> => {
    const res = await axios.put(`/v1/lab/requests/${id}/results`, { results }, { headers: authHeaders() });
    return { success: true, data: {
      labRequest: mapLabRequest(res.data.data.labRequest),
      criticalResults: res.data.data.criticalResults || [],
    }, error: null };
  },

  getCriticalLabResults: async (from?: string): Promise<ApiResponse<LabRequest[]>> => {
    const res = await axios.get('/v1/lab/results/critical', { headers: authHeaders(), params: { from } });
    return { success: true, data: (res.data.data || []).map(mapLabRequest), error: null };
  },

  getExpenses: async (): Promise<ApiResponse<Expense[]>> => {
    const res = await axios.get('/v1/expenses', { headers: authHeaders() });
    return { success: true, data: res.data.data.map(mapExpense), error: null, meta: res.data.meta };
  },

  createExpense: async (expense: Omit<Expense, 'id'>): Promise<ApiResponse<Expense>> => {
    const res = await axios.post('/v1/expenses', {
      ...expense,
      date: expense.date ? new Date(expense.date).toISOString() : new Date().toISOString(),
    }, { headers: authHeaders() });
    return { success: true, data: mapExpense(res.data.data), error: null };
  },

  updateExpense: async (id: string, data: Partial<Omit<Expense, 'id'>>): Promise<ApiResponse<Expense>> => {
    const body: Record<string, any> = { ...data };
    if (body.date) body.date = new Date(body.date).toISOString();
    const res = await axios.put(`/v1/expenses/${id}`, body, { headers: authHeaders() });
    return { success: true, data: mapExpense(res.data.data), error: null };
  },

  deleteExpense: async (id: string): Promise<ApiResponse<string>> => {
    await axios.delete(`/v1/expenses/${id}`, { headers: authHeaders() });
    return { success: true, data: id, error: null };
  },

  getInvoices: async (): Promise<ApiResponse<Invoice[]>> => {
    const res = await axios.get('/v1/invoices', { headers: authHeaders() });
    return { success: true, data: res.data.data.map(mapInvoice), error: null, meta: res.data.meta };
  },

  recordPayment: async (id: string, amount: number, paymentMethod: 'cash' | 'card' | 'transfer' = 'cash'): Promise<ApiResponse<Invoice>> => {
    const res = await axios.post(`/v1/invoices/${id}/payment`, { amount, paymentMethod }, { headers: authHeaders() });
    return { success: true, data: mapInvoice(res.data.data.invoice), error: null };
  },

  downloadInvoicePdf: async (id: string): Promise<Blob> => {
    const res = await axios.get(`/v1/invoices/${id}/pdf`, {
      headers: authHeaders(),
      responseType: 'blob',
    });
    return res.data;
  },

  createInvoice: async (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'status' | 'remainingAmount'>): Promise<ApiResponse<Invoice>> => {
    const patientsRes = await axios.get('/v1/patients', { headers: authHeaders() });
    let patientId = patientsRes.data.data?.[0]?._id;

    if (!patientId) {
      const newPatient = await axios.post('/v1/patients', {
        fullName: invoice.patientName || 'Walk-in',
        phonePrimary: '0000000000',
        gender: 'M',
        ageCategory: '19-35 ans',
      }, { headers: authHeaders() });
      patientId = newPatient.data.data._id;
    }

    const res = await axios.post('/v1/invoices', {
      patientId,
      items: [{ type: 'consultation', description: invoice.patientName, quantity: 1, unitPrice: invoice.totalAmount }],
    }, { headers: authHeaders() });

    const inv = mapInvoice(res.data.data);

    if (invoice.paidAmount > 0) {
      await axios.post(`/v1/invoices/${inv.id}/payment`, {
        amount: invoice.paidAmount,
        paymentMethod: 'cash',
      }, { headers: authHeaders() });
      const paidRes = await axios.get(`/v1/invoices/${inv.id}`, { headers: authHeaders() });
      return { success: true, data: mapInvoice(paidRes.data.data), error: null };
    }

    return { success: true, data: inv, error: null };
  },

  getFinancialReport: async (params?: { from?: string; to?: string }): Promise<ApiResponse<{
    period: { from: string; to: string };
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    byCategory: Record<string, number>;
    expensesByCategory: Record<string, number>;
    unpaidInvoices: number;
  }>> => {
    const res = await axios.get('/v1/reports/financial', { headers: authHeaders(), params });
    return { success: true, data: res.data.data, error: null };
  },

  getMedicalReport: async (params?: { from?: string; to?: string }): Promise<ApiResponse<{
    period: { from: string; to: string };
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowRate: number;
    topDiagnoses: string[];
    labRequests: { total: number; completed: number; criticalResults: number };
  }>> => {
    const res = await axios.get('/v1/reports/medical', { headers: authHeaders(), params });
    return { success: true, data: res.data.data, error: null };
  },

  getReceptionistDashboard: async (): Promise<ApiResponse<{
    stats: {
      todayAppointments: number;
      todayCheckedIn: number;
      todayRevenue: number;
      waitingRoomCount: number;
    };
    todayAgenda: Appointment[];
    recentInvoices: Invoice[];
  }>> => {
    const res = await axios.get('/v1/dashboard/receptionist', { headers: authHeaders() });
    return { success: true, data: res.data.data, error: null };
  },

  getDirectorDashboard: async (): Promise<ApiResponse<{
    stats: {
      todayRevenue: number;
      todayAppointments: number;
      monthlyRevenue: number;
      monthlyExpenses: number;
      monthlyProfit: number;
      pendingAppointments: number;
      unpaidInvoices: number;
      totalPatients: number;
      criticalResultsUnread: number;
    };
    recentAppointments: any[];
    recentExpenses: any[];
    lowStockAlert: null;
  }>> => {
    const res = await axios.get('/v1/dashboard/director', { headers: authHeaders() });
    return { success: true, data: res.data.data, error: null };
  },

  getDoctorDashboard: async (): Promise<ApiResponse<{
    stats: {
      todayAppointments: number;
      todayCompleted: number;
      weekAppointments: number;
      pendingLabResults: number;
      unreadNotifications: number;
    };
    todayAgenda: Appointment[];
    criticalResults: any[];
    recentPatients: any[];
  }>> => {
    const res = await axios.get('/v1/dashboard/doctor', { headers: authHeaders() });
    return { success: true, data: res.data.data, error: null };
  },

  getPublicSettings: async (): Promise<ApiResponse<{ clinicName: string }>> => {
    const res = await axios.get('/v1/settings/public');
    return res.data;
  },

  getSettings: async (): Promise<ApiResponse<ClinicSettings>> => {
    const res = await axios.get('/v1/settings', { headers: authHeaders() });
    return res.data;
  },

  updateSettings: async (data: Partial<ClinicSettings>): Promise<ApiResponse<ClinicSettings>> => {
    const res = await axios.put('/v1/settings', data, { headers: authHeaders() });
    return res.data;
  },

  getRevenueTrends: async (days?: number): Promise<ApiResponse<{
    trends: { date: string; revenue: number; count: number }[];
    totalRevenue: number;
  }>> => {
    const res = await axios.get('/v1/reports/revenue-trends', { headers: authHeaders(), params: { days } });
    return { success: true, data: res.data.data, error: null };
  },

  forgotPassword: async (username: string): Promise<ApiResponse<{ message: string }>> => {
    const res = await axios.post('/v1/auth/forgot-password', { username });
    return { success: true, data: res.data.data, error: null };
  },

  verifyOtp: async (username: string, otp: string): Promise<ApiResponse<{ message: string }>> => {
    const res = await axios.post('/v1/auth/verify-otp', { username, otp });
    return { success: true, data: res.data.data, error: null };
  },

  resetPassword: async (username: string, otp: string, newPassword: string): Promise<ApiResponse<{ message: string }>> => {
    const res = await axios.post('/v1/auth/reset-password', { username, otp, newPassword });
    return { success: true, data: res.data.data, error: null };
  },

  getNotifications: async (page = 1, limit = 30): Promise<ApiResponse<{
    notifications: { _id: string; type: string; title: string; body: string; isRead: boolean; createdAt: string; data?: any }[];
    unreadCount: number;
    total: number;
  }>> => {
    const res = await axios.get('/v1/notifications', { headers: authHeaders(), params: { page, limit } });
    return {
      success: true,
      data: {
        notifications: res.data.data || [],
        unreadCount: res.data.meta?.unreadCount ?? 0,
        total: res.data.meta?.total ?? 0,
      },
      error: null,
    };
  },

  markNotificationRead: async (id: string): Promise<ApiResponse<null>> => {
    await axios.patch(`/v1/notifications/${id}/read`, {}, { headers: authHeaders() });
    return { success: true, data: null, error: null };
  },

  markAllNotificationsRead: async (): Promise<ApiResponse<null>> => {
    await axios.patch('/v1/notifications/read-all', {}, { headers: authHeaders() });
    return { success: true, data: null, error: null };
  },
};
