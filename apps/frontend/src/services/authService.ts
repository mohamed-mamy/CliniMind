import { User } from '../store/authStore';

export const authService = {
  login: async (username: string, password: string): Promise<User> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const u = username.toLowerCase().trim();

    // Set role based on username hints, default to receptionist
    let role: User['role'] = 'receptionist';
    let fullName = 'سحر أحمد (استقبال)';

    if (u.includes('director') || u.includes('admin') || u.includes('مدير')) {
      role = 'director';
      fullName = 'د. أحمد يوسف (المدير)';
    } else if (u.includes('doctor') || u.includes('doc') || u.includes('طبيب')) {
      role = 'doctor';
      fullName = 'د. سارة محمود (طبيبة)';
    } else if (u.includes('lab') || u.includes('tech') || u.includes('مختبر')) {
      role = 'lab_technician';
      fullName = 'أسامة خالد (مختبر)';
    }

    // Passwords must be checked. We accept anything 4 chars+ for mocking
    if (password.length < 4) {
      throw new Error('كلمة المرور قصيرة جداً (الحد الأدنى 4 خانات)');
    }

    return {
      fullName,
      role,
    };
  },

  logout: async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
};
