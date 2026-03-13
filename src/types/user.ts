export type Role = 'admin' | 'faculty' | 'staff';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
}
