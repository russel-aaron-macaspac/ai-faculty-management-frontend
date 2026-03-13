'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
