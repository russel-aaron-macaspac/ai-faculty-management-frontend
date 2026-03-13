import { Staff } from '@/types/staff';
import { delay } from './api';

let mockStaffData: Staff[] = [
  { id: 's1', name: 'Emily Davis', department: 'HR', role: 'HR Manager', contactInfo: 'emily@university.edu', employmentDate: '2020-01-15', status: 'active' },
  { id: 's2', name: 'Michael Johnson', department: 'IT', role: 'Systems Administrator', contactInfo: 'michael.j@university.edu', employmentDate: '2019-03-10', status: 'active' },
  { id: 's3', name: 'Sarah Wilson', department: 'Facilities', role: 'Maintenance Supervisor', contactInfo: 'sarah.w@university.edu', employmentDate: '2021-08-01', status: 'inactive' },
];

export const staffService = {
  getStaff: async (): Promise<Staff[]> => {
    await delay(500);
    return [...mockStaffData];
  },
  
  getStaffById: async (id: string): Promise<Staff | undefined> => {
    await delay(300);
    return mockStaffData.find(s => s.id === id);
  },

  createStaff: async (data: Omit<Staff, 'id'>): Promise<Staff> => {
    await delay(600);
    const newStaff: Staff = {
      ...data,
      id: `s${Date.now()}`
    };
    mockStaffData.push(newStaff);
    return newStaff;
  },

  updateStaff: async (id: string, data: Partial<Staff>): Promise<Staff> => {
    await delay(600);
    const index = mockStaffData.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Staff not found');
    
    mockStaffData[index] = { ...mockStaffData[index], ...data };
    return mockStaffData[index];
  },

  deleteStaff: async (id: string): Promise<void> => {
    await delay(400);
    mockStaffData = mockStaffData.filter(s => s.id !== id);
  }
};
