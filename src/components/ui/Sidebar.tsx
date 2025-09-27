'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from './utils';
import ThemeSwitcher from './ThemeSwitcher';
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
  Search,
  BarChart3,
  Activity
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface SidebarProps {
  apps: Array<{
    id: string;
    name: string;
    domain: string;
    isActive: boolean;
  }>;
  currentAppId?: string;
  onAppSelect?: (appId: string) => void;
  onCreateApp?: () => void;
  onLogout?: () => void;
}

export default function Sidebar({ apps, currentAppId, onAppSelect, onCreateApp, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
  ];

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNavigation = (href: string) => {
    if (href !== '#') {
      router.push(href);
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
                <Image
                  src="/growthkit-logo.png"
                  alt="GrowthKit"
                  width={collapsed ? 40 : 150}
                  height={collapsed ? 40 : 40}
                  className={cn(
                    "object-contain transition-all duration-200",
                    collapsed ? "mx-auto" : ""
                  )}
                  priority
                />
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

          {/* Search */}
          {!collapsed && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 dark:text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search apps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      'w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors',
                      item.active ? 
                        'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 
                        'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
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
                  {filteredApps.map((app) => (
                    <li key={app.id}>
                      <button
                        onClick={() => onAppSelect?.(app.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                          currentAppId === app.id ? 
                            'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 
                            'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
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
