export type AppRole = 'center_admin' | 'district_admin' | 'dept_admin' | 'citizen';

const roleMap: Record<string, AppRole> = {
  center_admin: 'center_admin',
  district_admin: 'district_admin',
  dept_admin: 'dept_admin',
  citizen: 'citizen',
  admin: 'center_admin',
  manager: 'district_admin',
  analyst: 'dept_admin',
  viewer: 'citizen',
};

export function normalizeRole(role: string | null | undefined): AppRole {
  if (!role) return 'citizen';
  return roleMap[role] ?? 'citizen';
}

export function canAccess(required: AppRole[], currentRole: AppRole): boolean {
  return required.includes(currentRole);
}
