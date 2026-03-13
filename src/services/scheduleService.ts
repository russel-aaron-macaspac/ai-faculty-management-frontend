import { Schedule } from '@/types/schedule';
import { delay } from './api';

let mockScheduleData: Schedule[] = [
  { id: 'sc1', employeeId: 'faculty_user', employeeName: 'Faculty User', type: 'class', subjectOrRole: 'CS101 Intro to Programming', room: 'Computer Laboratory 1', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:30', conflictWarning: false },
  { id: 'sc2', employeeId: 'faculty_user', employeeName: 'Faculty User', type: 'class', subjectOrRole: 'MATH201 Calculus', room: 'Room 301', dayOfWeek: 'Monday', startTime: '11:00', endTime: '12:30', conflictWarning: false },
  { id: 'sc3', employeeId: 'faculty_user', employeeName: 'Faculty User', type: 'class', subjectOrRole: 'CS205 Advanced Algorithms', room: 'Computer Laboratory 2', dayOfWeek: 'Tuesday', startTime: '13:00', endTime: '15:00', conflictWarning: false },
  { id: 'sc4', employeeId: 'faculty_user', employeeName: 'Faculty User', type: 'class', subjectOrRole: 'IT302 Cloud Infrastructure', room: 'Networking Lab', dayOfWeek: 'Wednesday', startTime: '08:00', endTime: '10:00', conflictWarning: false },
  { id: 'sc5', employeeId: 'faculty_user', employeeName: 'Faculty User', type: 'class', subjectOrRole: 'SE401 Software Design', room: 'Room 401', dayOfWeek: 'Thursday', startTime: '15:00', endTime: '17:00', conflictWarning: false },
  
  // A conflict example for another faculty to show the system works
  { id: 'sc6', employeeId: 'f2', employeeName: 'Prof. Bob Wilson', type: 'class', subjectOrRole: 'MATH101 Algebra', room: 'Room 201', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:30', conflictWarning: false },
  { id: 'sc7', employeeId: 'f3', employeeName: 'Dr. Jane Smith', type: 'class', subjectOrRole: 'PHY101 Physics', room: 'Room 201', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:30', conflictWarning: true }, 

  { id: 'sc8', employeeId: 's1', employeeName: 'Staff User', type: 'shift', subjectOrRole: 'HR Office Duty', dayOfWeek: 'Monday', startTime: '08:00', endTime: '17:00' },
];

export const scheduleService = {
  getSchedules: async (): Promise<Schedule[]> => {
    await delay(500);
    return [...mockScheduleData];
  },
  
  createSchedule: async (data: Omit<Schedule, 'id'>): Promise<Schedule> => {
    await delay(600);
    const newSchedule: Schedule = {
      ...data,
      id: `sc${Date.now()}`
    };
    mockScheduleData.push(newSchedule);
    return newSchedule;
  },

  deleteSchedule: async (id: string): Promise<void> => {
    await delay(400);
    mockScheduleData = mockScheduleData.filter(s => s.id !== id);
  }
};
