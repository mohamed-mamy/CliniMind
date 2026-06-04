// Standard API response envelope matching Frontend-Plan.md
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

// Domain Interfaces
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
  patientName: string;
  timeSlot: string;
  reason: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  doctorName: string;
  room: string;
}

export interface LabRequest {
  id: string;
  patientName: string;
  location: string;
  testName: string;
  priority: 'normal' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  time: string;
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

// In-Memory Database for Mock Mode
const MOCK_PATIENTS: Patient[] = [
  {
    id: "1",
    fullName: "يوسف عبدالله",
    fileNumber: "9482",
    phonePrimary: "050-123-4567",
    lastVisit: "اليوم",
    ageCategory: "19-35 ans",
    gender: "M",
    bloodType: "O+",
    allergies: [{ type: "food", description: "Fraise / الفراولة" }],
    chronicDiseases: ["asthma"],
    confidentialNotes: "المريض يعاني من ربو خفيف ويستخدم البخاخ عند الضرورة."
  },
  {
    id: "2",
    fullName: "سارة العتيبي",
    fileNumber: "7391",
    phonePrimary: "055-987-6543",
    lastVisit: "12 مايو",
    ageCategory: "19-35 ans",
    gender: "F",
    bloodType: "A-",
    allergies: [],
    chronicDiseases: [],
    confidentialNotes: "مراجعة اعتيادية."
  },
  {
    id: "3",
    fullName: "محمد الفهد",
    fileNumber: "1024",
    phonePrimary: "053-444-5555",
    lastVisit: "3 مارس 2023",
    ageCategory: "36-50 ans",
    gender: "M",
    bloodType: "B+",
    allergies: [{ type: "medication", description: "Pénicilline" }],
    chronicDiseases: ["diabetes", "hypertension"],
    confidentialNotes: "مريض سكري من النوع الثاني ملتزم بالحمية والعلاج."
  },
];

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "1",
    patientName: "فاطمة علي محمد",
    timeSlot: "09:00",
    reason: "مراجعة دورية",
    status: "scheduled",
    doctorName: "د. أحمد يوسف",
    room: "غرفة 3",
  },
  {
    id: "2",
    patientName: "خالد حسن عبدالله",
    timeSlot: "10:30",
    reason: "استشارة طبية",
    status: "confirmed",
    doctorName: "د. أحمد يوسف",
    room: "غرفة 3",
  },
  {
    id: "3",
    patientName: "مريم سعد الجاسم",
    timeSlot: "11:15",
    reason: "تخطيط قلب",
    status: "completed",
    doctorName: "د. سارة محمود",
    room: "غرفة 1",
  },
  {
    id: "4",
    patientName: "عمر طارق زكي",
    timeSlot: "01:00",
    reason: "متابعة ضغط الدم",
    status: "confirmed",
    doctorName: "د. سارة محمود",
    room: "غرفة 2",
  },
];

const MOCK_LAB_REQUESTS: LabRequest[] = [
  {
    id: "1",
    patientName: "فاطمة علي سعيد",
    location: "غرفة العناية المركزة - سرير 4",
    testName: "غازات الدم الشرياني (ABG)",
    priority: "urgent",
    status: "pending",
    time: "منذ 10 دقائق",
  },
  {
    id: "2",
    patientName: "محمد عبدالله",
    location: "قسم الطوارئ",
    testName: "زراعة دم سريع (Blood Culture)",
    priority: "urgent",
    status: "pending",
    time: "منذ 25 دقيقة",
  },
  {
    id: "3",
    patientName: "خالد إبراهيم",
    location: "العيادات الخارجية",
    testName: "وظائف الكبد (LFT)",
    priority: "normal",
    status: "pending",
    time: "وقت الطلب: 09:30 ص",
  },
  {
    id: "4",
    patientName: "نورة سعيد",
    location: "جناح النساء والولادة",
    testName: "تحليل بول كامل",
    priority: "normal",
    status: "pending",
    time: "وقت الطلب: 10:15 ص",
  },
];

const MOCK_EXPENSES: Expense[] = [
  { id: "1", category: "supplies", amount: 1500, description: "شراء مستلزمات طبية وقفازات معقمة", date: "2026-06-01" },
  { id: "2", category: "utilities", amount: 450, description: "فاتورة الكهرباء والماء لشهر مايو", date: "2026-05-28" },
  { id: "3", category: "salary", amount: 12000, description: "رواتب طاقم الاستقبال والممرضين", date: "2026-05-30" },
];

const MOCK_INVOICES: Invoice[] = [
  { id: "1", invoiceNumber: "INV-1001", patientName: "يوسف عبدالله", totalAmount: 350, paidAmount: 350, remainingAmount: 0, status: "paid", createdAt: "2026-06-04" },
  { id: "2", invoiceNumber: "INV-1002", patientName: "سارة العتيبي", totalAmount: 500, paidAmount: 200, remainingAmount: 300, status: "partial", createdAt: "2026-06-03" },
  { id: "3", invoiceNumber: "INV-1003", patientName: "محمد الفهد", totalAmount: 150, paidAmount: 0, remainingAmount: 150, status: "unpaid", createdAt: "2026-06-02" },
];

// Helper to simulate API response wrap
function makeResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
  };
}

export const api = {
  // --- PATIENTS ---
  getPatients: async (): Promise<ApiResponse<Patient[]>> => {
    return makeResponse([...MOCK_PATIENTS]);
  },
  createPatient: async (patient: Omit<Patient, 'id' | 'fileNumber' | 'lastVisit'>): Promise<ApiResponse<Patient>> => {
    const newPatient: Patient = {
      ...patient,
      id: String(MOCK_PATIENTS.length + 1),
      fileNumber: String(Math.floor(1000 + Math.random() * 9000)),
      lastVisit: 'اليوم',
    };
    MOCK_PATIENTS.unshift(newPatient);
    return makeResponse(newPatient);
  },
  deletePatient: async (id: string): Promise<ApiResponse<string>> => {
    const idx = MOCK_PATIENTS.findIndex(p => p.id === id);
    if (idx !== -1) {
      MOCK_PATIENTS.splice(idx, 1);
    }
    return makeResponse(id);
  },

  // --- APPOINTMENTS ---
  getAppointments: async (): Promise<ApiResponse<Appointment[]>> => {
    return makeResponse([...MOCK_APPOINTMENTS]);
  },
  updateAppointmentStatus: async (id: string, status: Appointment['status']): Promise<ApiResponse<Appointment>> => {
    const appt = MOCK_APPOINTMENTS.find(a => a.id === id);
    if (appt) {
      appt.status = status;
      return makeResponse(appt);
    }
    throw new Error('Appointment not found');
  },

  // --- LABORATORY ---
  getLabRequests: async (): Promise<ApiResponse<LabRequest[]>> => {
    return makeResponse([...MOCK_LAB_REQUESTS]);
  },
  updateLabRequestStatus: async (id: string, status: LabRequest['status']): Promise<ApiResponse<LabRequest>> => {
    const req = MOCK_LAB_REQUESTS.find(r => r.id === id);
    if (req) {
      req.status = status;
      return makeResponse(req);
    }
    throw new Error('Lab request not found');
  },

  // --- EXPENSES (Nouveau) ---
  getExpenses: async (): Promise<ApiResponse<Expense[]>> => {
    return makeResponse([...MOCK_EXPENSES]);
  },
  createExpense: async (expense: Omit<Expense, 'id'>): Promise<ApiResponse<Expense>> => {
    const newExpense: Expense = {
      ...expense,
      id: String(MOCK_EXPENSES.length + 1),
    };
    MOCK_EXPENSES.unshift(newExpense);
    return makeResponse(newExpense);
  },
  deleteExpense: async (id: string): Promise<ApiResponse<string>> => {
    const idx = MOCK_EXPENSES.findIndex(e => e.id === id);
    if (idx !== -1) {
      MOCK_EXPENSES.splice(idx, 1);
    }
    return makeResponse(id);
  },

  // --- BILLING / INVOICES ---
  getInvoices: async (): Promise<ApiResponse<Invoice[]>> => {
    return makeResponse([...MOCK_INVOICES]);
  },
  createInvoice: async (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'status' | 'remainingAmount'>): Promise<ApiResponse<Invoice>> => {
    const newInvoice: Invoice = {
      ...invoice,
      id: String(MOCK_INVOICES.length + 1),
      invoiceNumber: `INV-${1000 + MOCK_INVOICES.length + 1}`,
      remainingAmount: invoice.totalAmount - invoice.paidAmount,
      status: invoice.paidAmount === 0 ? 'unpaid' : invoice.paidAmount >= invoice.totalAmount ? 'paid' : 'partial'
    };
    MOCK_INVOICES.unshift(newInvoice);
    return makeResponse(newInvoice);
  },
};
