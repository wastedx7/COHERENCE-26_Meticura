import { NavLink } from 'react-router-dom';
import { AppRole } from '../../lib/permissions';

type LinkItem = { to: string; label: string; roles: AppRole[] };

const links: LinkItem[] = [
  { to: '/dashboard', label: 'Dashboard', roles: ['center_admin', 'district_admin', 'dept_admin'] },
  { to: '/budget', label: 'Budget', roles: ['center_admin', 'district_admin', 'dept_admin'] },
  { to: '/anomalies', label: 'Anomalies', roles: ['center_admin', 'district_admin', 'dept_admin'] },
  { to: '/lapse', label: 'Lapse', roles: ['center_admin', 'district_admin', 'dept_admin'] },
  { to: '/reallocation', label: 'Reallocation', roles: ['center_admin', 'district_admin', 'dept_admin'] },
  { to: '/reports', label: 'Reports', roles: ['center_admin', 'district_admin', 'dept_admin'] },
  { to: '/tree', label: 'Tree', roles: ['center_admin', 'district_admin'] },
  { to: '/users', label: 'Users', roles: ['center_admin'] },
  { to: '/engine', label: 'Engine', roles: ['center_admin'] },
  { to: '/my-models', label: 'My Models', roles: ['center_admin', 'district_admin'] },
  { to: '/transactions', label: 'Transactions', roles: ['dept_admin'] },
  { to: '/citizen', label: 'Citizen View', roles: ['citizen'] },
];

export function Sidebar({ role }: { role: AppRole }) {
  return (
    <aside className="h-screen w-64 border-r border-zinc-800 bg-zinc-950 p-4">
      <h1 className="mb-6 text-lg font-semibold text-zinc-100">Budget Watchdog</h1>
      <nav className="space-y-1">
        {links
          .filter((l) => l.roles.includes(role))
          .map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm ${isActive ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-900'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
}
