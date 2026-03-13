import { User, Role } from '@/types/user';
import { delay } from './api';

const MOCK_USERS: User[] = [
  { id: 'u1', email: 'admin@system.com', name: 'System Admin', role: 'admin' },
  { id: 'u2', email: 'faculty@system.com', name: 'Dr. John Doe', role: 'faculty' },
  { id: 'u3', email: 'staff@system.com', name: 'Jane Smith', role: 'staff' },
];

export const authService = {
  login: async (email: string, password: string):Promise<{user: User; token: string}> => {
    await delay(800);
    const user = MOCK_USERS.find(u => u.email === email);
    if (!user || password !== 'password123') { // Simple mock validation
      throw new Error('Invalid email or password');
    }
    return {
      user,
      token: 'mock-jwt-token-12345'
    };
  },
  
  logout: async (): Promise<void> => {
    await delay(300);
    // In a real app, remove token from storage
  }
};
