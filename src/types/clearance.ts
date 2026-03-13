export interface Clearance {
  id: string;
  employeeId: string;
  employeeName: string;
  requiredDocument: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  submissionDate?: string;
  validationWarning?: string;
}
