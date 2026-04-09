import type { ApprovalOfficerId } from '@/lib/roleConfig';

export type Role = 'admin' | 'faculty' | ApprovalOfficerId;

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
}
