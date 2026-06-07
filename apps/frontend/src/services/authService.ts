import axios from 'axios';
import { User } from '../store/authStore';

interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: string;
    refreshTokenExpiresAt: string;
  };
  error: null | { code: string; message: string };
}

export const authService = {
  login: async (username: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
    const response = await axios.post<LoginResponse>('/v1/auth/login', { username, password });
    const { data } = response.data;

    return {
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  },

  refresh: async (refreshToken: string): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
    const response = await axios.post<LoginResponse>('/v1/auth/refresh', { refreshToken });
    const { data } = response.data;

    return {
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  },

  logout: async (accessToken: string): Promise<void> => {
    await axios.post('/v1/auth/logout', {}, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },

  forgotPassword: async (email: string): Promise<boolean> => {
    const response = await axios.post('/v1/auth/forgot-password', { email });
    return response.data.success;
  },

  resetPassword: async (email: string, code: string, newPassword: string): Promise<boolean> => {
    const response = await axios.post('/v1/auth/reset-password', { email, code, newPassword });
    return response.data.success;
  },
};
