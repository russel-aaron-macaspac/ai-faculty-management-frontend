'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, AuthUser, UserRole } from '@/services/authService';

interface UseRoleBasedAccessOptions {
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export const useRoleBasedAccess = (options: UseRoleBasedAccessOptions) => {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const allowedRolesKey = options.allowedRoles.join('|');
  const fallbackRedirect = options.redirectTo || '/dashboard/admin';

  useEffect(() => {
    const currentUser = authService.getCachedUser();

    if (!currentUser) {
      // Redirect to login if no user
      setIsAuthorized(false);
      setUser(null);
      setIsLoading(false);
      router.replace('/login');
      return;
    }

    const hasAccess = options.allowedRoles.includes(currentUser.role);

    if (!hasAccess) {
      // Redirect to dashboard if user doesn't have access
      setIsAuthorized(false);
      setUser(null);
      setIsLoading(false);
      router.replace(fallbackRedirect);
      return;
    }

    setUser(currentUser);
    setIsAuthorized(true);
    setIsLoading(false);
  }, [allowedRolesKey, fallbackRedirect, router]);

  return { user, isAuthorized, isLoading };
};
