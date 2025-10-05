'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from './utils';
import { ChevronDown, Building2, Check } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
}

interface OrgSwitcherProps {
  organizations: Organization[];
  currentOrgId?: string;
  onOrgChange?: (orgId: string) => void;
  className?: string;
}

export default function OrgSwitcher({ 
  organizations, 
  currentOrgId, 
  onOrgChange,
  className 
}: OrgSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOrg = organizations.find(org => org.id === currentOrgId) || organizations[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOrgSelect = (orgId: string) => {
    onOrgChange?.(orgId);
    setIsOpen(false);
  };

  if (organizations.length === 0) {
    return (
      <div className={cn('p-4 border-b border-gray-200 dark:border-gray-700', className)}>
        <div className="flex items-center px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
          <Building2 size={18} className="mr-2" />
          <span>No organizations</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('p-4 border-b border-gray-200 dark:border-gray-700', className)} ref={dropdownRef}>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <div className="flex items-center min-w-0">
            <Building2 size={18} className="mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span className="truncate font-medium text-gray-900 dark:text-white">
              {currentOrg?.name || 'Select Organization'}
            </span>
          </div>
          <ChevronDown 
            size={16} 
            className={cn(
              'text-gray-400 dark:text-gray-500 transition-transform flex-shrink-0 ml-2',
              isOpen && 'rotate-180'
            )} 
          />
        </button>

        {/* Dropdown */}
        {isOpen && organizations.length > 1 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleOrgSelect(org.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-md last:rounded-b-md"
              >
                <div className="flex items-center min-w-0">
                  <Building2 size={16} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span className="truncate text-gray-900 dark:text-white">
                    {org.name}
                  </span>
                </div>
                {org.id === currentOrgId && (
                  <Check size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
