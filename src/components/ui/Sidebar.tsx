'use client';

import React, { useState, useEffect } from 'react';
import { cn } from './utils';
import ThemeSwitcher from './ThemeSwitcher';
import SmartLogo from './SmartLogo';
import OrgSwitcher from './OrgSwitcher';
import { 
  Home, 
  Package, 
  Clock, 
  Mail, 
  DollarSign, 
  Ticket, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  LogOut,
  Plus,
  BarChart3,
  Activity,
  Users,
  User
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface SidebarProps {
  apps: Array<{
    id: string;
    name: string;
    domain: string;
    isActive: boolean;
  }>;
  organizations: Array<{
    id: string;
    name: string;
  }>;
  currentAppId?: string;
  currentOrgId?: string;
  userInfo?: {
    name: string;
    email: string;
  };
  onAppSelect?: (appId: string) => void;
  onOrgChange?: (orgId: string) => void;
  onCreateApp?: () => void;
  onLogout?: () => void;
}

export default function Sidebar({ 
  apps, 
  organizations, 
  currentAppId, 
  currentOrgId, 
  userInfo,
  onAppSelect, 
  onOrgChange, 
  onCreateApp, 
  onLogout 
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navigationItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Home, 
      href: '/admin/dashboard',
      active: pathname === '/admin/dashboard' || pathname === '/admin'
    },
    { 
      id: 'apps-list', 
      label: 'Applications', 
      icon: Package, 
      href: '/admin/apps',
      active: pathname.startsWith('/admin/apps')
    },
    { 
      id: 'cron', 
      label: 'Cron Monitor', 
      icon: Clock, 
      href: '/admin/cron',
      active: pathname === '/admin/cron'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: BarChart3, 
      href: '/admin/analytics',
      active: pathname === '/admin/analytics'
    },
    { 
      id: 'team', 
      label: 'Team', 
      icon: Users, 
      href: '/admin/team',
      active: pathname === '/admin/team'
    },
  ];

  // No longer need filtering since we removed search

  const handleNavigation = (href: string, label: string) => {
    if (href !== '#') {
      // Provide immediate visual feedback
      router.push(href);
    }
  };

  const handlePrefetch = (href: string) => {
    if (href !== '#') {
      router.prefetch(href);
    }
  };

  return (
    <>
      {/* Mobile menu toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-gray-900 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          'fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className={cn(
                "flex items-center",
                collapsed ? "justify-center w-full" : ""
              )}>
                <SmartLogo collapsed={collapsed} />
              </div>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className={cn(
                  "hidden lg:block p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800",
                  collapsed ? "absolute right-2 top-4" : ""
                )}
              >
                {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            </div>
          </div>

          {/* Organization Switcher */}
          {!collapsed && (
            <OrgSwitcher
              organizations={organizations}
              currentOrgId={currentOrgId}
              onOrgChange={onOrgChange}
            />
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigation(item.href, item.label)}
                    onMouseEnter={() => handlePrefetch(item.href)}
                    onFocus={() => handlePrefetch(item.href)}
                    disabled={item.active}
                    className={cn(
                      'w-full flex items-center px-3 py-2 text-sm rounded-md transition-all duration-200',
                      item.active ? 
                        'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 cursor-default' : 
                        'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95',
                      collapsed && 'justify-center'
                    )}
                  >
                    <item.icon size={20} />
                    {!collapsed && <span className="ml-3">{item.label}</span>}
                  </button>
                </li>
              ))}
              
              {/* Apps list */}
              {!collapsed && (
                <>
                  <li className="mt-4">
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Your Apps</span>
                      <button
                        onClick={onCreateApp}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </li>
                  {apps.map((app) => (
                    <li key={app.id}>
                      <button
                        onClick={() => onAppSelect?.(app.id)}
                        disabled={currentAppId === app.id}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-all duration-200',
                          currentAppId === app.id ? 
                            'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 cursor-default' : 
                            'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95'
                        )}
                      >
                        <div className="flex items-center">
                          <div className={cn(
                            'w-2 h-2 rounded-full mr-2',
                            app.isActive ? 'bg-green-500' : 'bg-red-500'
                          )} />
                          <span className="truncate">{app.name}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </nav>

          {/* Footer */}
          <div className="relative p-4 border-t border-gray-200 dark:border-gray-700">
            {/* User Info */}
            {!collapsed && userInfo && userInfo.name && userInfo.email && (
              <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {userInfo.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {userInfo.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {userInfo.email}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Theme Switcher and Logout */}
            <div className="flex items-center justify-between mb-3">
              <ThemeSwitcher />
            </div>
            <button
              onClick={onLogout}
              className={cn(
                'w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                collapsed && 'justify-center'
              )}
            >
              <LogOut size={20} />
              {!collapsed && <span className="ml-3">Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
