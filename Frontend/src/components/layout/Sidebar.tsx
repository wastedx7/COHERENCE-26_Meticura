import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  AlertTriangle,
  ArrowLeftRight,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUIStore } from '../../store';
import { Badge } from '../ui/Badge';

const navigationItems = [
  {
    path: '/dashboard/overview',
    label: 'Overview',
    icon: LayoutDashboard,
  },
  {
    path: '/dashboard/districts',
    label: 'Districts',
    icon: MapPin,
  },
  {
    path: '/dashboard/alerts',
    label: 'Alerts',
    icon: AlertTriangle,
    showBadge: true,
  },
  {
    path: '/dashboard/reallocation',
    label: 'Reallocation',
    icon: ArrowLeftRight,
  },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, unreadAlertsCount } = useUIStore();

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {sidebarCollapsed ? <Menu size={24} /> : <X size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out',
          sidebarCollapsed && 'transform -translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">Meticura</h1>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 rounded-lg transition-colors',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {item.showBadge && unreadAlertsCount > 0 && (
                      <Badge variant="danger" size="sm">
                        {unreadAlertsCount}
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <p className="text-xs text-gray-400 text-center">
            Budget Management Dashboard
          </p>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {!sidebarCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};
