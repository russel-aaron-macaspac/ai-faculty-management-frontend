'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { isApprovalOfficer } from '@/lib/roleConfig';

type StoredUser = {
  role?: string;
};

export default function ClearanceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) {
      router.replace('/login');
      return;
    }

    try {
      const user = JSON.parse(raw) as StoredUser;
      const hasAccess = user.role === 'admin' || user.role === 'faculty' || isApprovalOfficer(user.role);

      if (!hasAccess) {
        router.replace('/dashboard/staff');
        return;
      }

      setAllowed(true);
    } catch {
      router.replace('/login');
    }
  }, [router]);

  if (!allowed) {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
