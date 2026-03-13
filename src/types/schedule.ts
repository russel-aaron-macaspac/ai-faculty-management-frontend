export interface Schedule {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'class' | 'shift';
  subjectOrRole: string;
  room?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  conflictWarning?: boolean;
}
