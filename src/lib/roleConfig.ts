/**
 * Centralized role configuration for all approval officers
 * Single source of truth for role management - no more manual repetition!
 */

export interface ApprovalOfficer {
  id: string;
  email: string;
  name: string;
  label: string;
  dashboardPath: string;
}

/**
 * All approval officer roles - add new roles here only!
 * This config automatically generates:
 * - Role types
 * - Auth fallback accounts
 * - Navigation menus
 * - Visibility checks
 */
export const APPROVAL_OFFICERS: ApprovalOfficer[] = [
  {
    id: 'dlrc',
    email: 'dlrc@sdca.edu.ph',
    name: 'DLRC Officer',
    label: 'DLRC Clearance Approvals',
    dashboardPath: '/dashboard/staff',
  },
  {
    id: 'pmo',
    email: 'pmo@sdca.edu.ph',
    name: 'PMO Officer',
    label: 'PMO Clearance Approvals',
    dashboardPath: '/dashboard/staff',
  },
  {
    id: 'laboratory',
    email: 'laboratory@sdca.edu.ph',
    name: 'Laboratory Officer',
    label: 'Laboratory Clearance Approvals',
    dashboardPath: '/dashboard/staff',
  },
  {
    id: 'ict',
    email: 'ict@sdca.edu.ph',
    name: 'ICT Officer',
    label: 'ICT Clearance Approvals',
    dashboardPath: '/dashboard/staff',
  },
  {
    id: 'ceso',
    email: 'ceso@sdca.edu.ph',
    name: 'CESO Officer',
    label: 'CESO Clearance Approvals',
    dashboardPath: '/dashboard/staff',
  },
  {
    id: 'programchair',
    email: 'programchair@sdca.edu.ph',
    name: 'Program Chair Officer',
    label: 'Program Chair Clearance Approvals',
    dashboardPath: '/dashboard/staff',
  },
  {
    id: 'dean',
    email: 'dean@sdca.edu.ph',
    name: 'Dean Officer',
    label: 'Dean Clearance Approvals',
    dashboardPath: '/dashboard/staff',
  },
  {
    id: 'registrar',
    email: 'registrar@sdca.edu.ph',
    name: 'Registrar Officer',
    label: 'Registrar Clearance Approvals',
    dashboardPath: '/dashboard/staff',
  },
  {
    id: 'ovprel',
    email: 'ovprel@sdca.edu.ph',
    name: 'OVPREL Officer',
    label: 'OVPREL Clearance Approvals',
    dashboardPath: '/dashboard/staff',
  },
  {
    id: 'ovpaa',
    email: 'ovpaa@sdca.edu.ph',
    name: 'OVPAA Officer',
    label: 'OVPAA Clearance Approvals',
    dashboardPath: '/dashboard/staff',
  },
  {
    id: 'account',
    email: 'account@sdca.edu.ph',
    name: 'Accounting Officer',
    label: 'Accounting Clearance Approvals',
    dashboardPath: '/dashboard/staff',
  },
  {
    id: 'treasury',
    email: 'treasury@sdca.edu.ph',
    name: 'Treasury Officer',
    label: 'Treasury Clearance Approvals',
    dashboardPath: '/dashboard/staff',
  },
  {
    id: 'hro',
    email: 'hro@sdca.edu.ph',
    name: 'HRO Officer',
    label: 'HRO Clearance Approvals',
    dashboardPath: '/dashboard/staff',
  },
];

/**
 * Helper: Check if a role is an approval officer
 */
export const isApprovalOfficer = (role: string | undefined): boolean => {
  return Boolean(role && APPROVAL_OFFICERS.some(o => o.id === role));
};

/**
 * Helper: Get approval officer config by ID
 */
export const getApprovalOfficerConfig = (roleId: string): ApprovalOfficer | undefined => {
  return APPROVAL_OFFICERS.find(o => o.id === roleId);
};

/**
 * Helper: Get clearance page title and subtitle
 */
export const getClearancePageInfo = (role: string | undefined): { title: string; subtitle: string } => {
  if (role === 'faculty') {
    return {
      title: 'Clearance Offices',
      subtitle: 'Track required office and department signatures for your clearance.',
    };
  }

  const officer = getApprovalOfficerConfig(role || '');
  if (officer) {
    return {
      title: officer.label,
      subtitle: `Review and approve faculty clearance requests for ${officer.label}.`,
    };
  }

  return {
    title: 'Clearance & Compliance',
    subtitle: 'Track and validate required employee documents.',
  };
};

/**
 * Get all approval officer role IDs as a tuple
 * Used for type inference and validation
 */
export type ApprovalOfficerId = 
  | 'dlrc'
  | 'pmo'
  | 'laboratory'
  | 'ict'
  | 'ceso'
  | 'programchair'
  | 'dean'
  | 'registrar'
  | 'ovprel'
  | 'ovpaa'
  | 'account'
  | 'treasury'
  | 'hro';
