import { Faculty } from '@/types/faculty';
import { delay } from './api';

let mockFacultyData: Faculty[] = [
  { id: 'f1', fullName: 'Dr. Alice Brown', email: 'alice@university.edu', department: 'Computer Science', phone: '+1234567890', status: 'active' },
  { id: 'f2', fullName: 'Prof. Bob Wilson', email: 'bob@university.edu', department: 'Mathematics', phone: '+1987654321', status: 'on_leave' },
  { id: 'f3', fullName: 'Dr. Charlie Davis', email: 'charlie@university.edu', department: 'Physics', phone: '+1122334455', status: 'active' },
];

export const facultyService = {
  getFaculty: async (): Promise<Faculty[]> => {
    await delay(500);
    return [...mockFacultyData];
  },
  
  getFacultyById: async (id: string): Promise<Faculty | undefined> => {
    await delay(300);
    return mockFacultyData.find(f => f.id === id);
  },

  createFaculty: async (data: Omit<Faculty, 'id'>): Promise<Faculty> => {
    await delay(600);
    const newFaculty: Faculty = {
      ...data,
      id: `f${Date.now()}`
    };
    mockFacultyData.push(newFaculty);
    return newFaculty;
  },

  updateFaculty: async (id: string, data: Partial<Faculty>): Promise<Faculty> => {
    await delay(600);
    const index = mockFacultyData.findIndex(f => f.id === id);
    if (index === -1) throw new Error('Faculty not found');
    
    mockFacultyData[index] = { ...mockFacultyData[index], ...data };
    return mockFacultyData[index];
  },

  deleteFaculty: async (id: string): Promise<void> => {
    await delay(400);
    mockFacultyData = mockFacultyData.filter(f => f.id !== id);
  }
};
