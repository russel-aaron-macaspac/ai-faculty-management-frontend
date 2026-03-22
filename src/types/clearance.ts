export interface Clearance {
  id: string;
  employeeId: string;
  employeeName: string;
  requiredDocument: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  submissionDate?: string;
  validationWarning?: string;
  dlrcReviewNotes?: string;
  previousStatus?: 'pending' | 'submitted' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
}
