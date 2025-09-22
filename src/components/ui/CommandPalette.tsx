'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Package,
  Users,
  Mail,
  Settings,
  Clock,
  DollarSign,
  FileText,
  ArrowRight,
  Command,
  Home,
  BarChart,
  X
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  type: 'navigation' | 'action' | 'app';
  action?: () => void;
  path?: string;
  keywords?: string[];
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Define available commands
  const commands: CommandItem[] = [
    // Navigation commands
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      description: 'Navigate to main dashboard',
      icon: Home,
      type: 'navigation',
      path: '/admin/dashboard',
      keywords: ['home', 'overview'],
    },
    {
      id: 'nav-apps',
      label: 'View Apps',
      description: 'Manage your applications',
      icon: Package,
      type: 'navigation',
      path: '/admin/apps',
      keywords: ['applications', 'projects'],
    },
    {
      id: 'nav-analytics',
      label: 'Analytics',
      description: 'View analytics and metrics',
      icon: BarChart,
      type: 'navigation',
      path: '/admin/analytics',
      keywords: ['metrics', 'stats', 'data'],
    },
    // Actions
    {
      id: 'action-create-app',
      label: 'Create New App',
      description: 'Create a new application',
      icon: Package,
      type: 'action',
      action: () => {
        setIsOpen(false);
        router.push('/admin/apps/new');
      },
      keywords: ['new', 'add'],
    },
    {
      id: 'nav-cron-monitor',
      label: 'Cron Job Monitor',
      description: 'View cron job execution history',
      icon: Clock,
      type: 'navigation',
      path: '/admin/cron',
      keywords: ['jobs', 'schedule', 'automation', 'monitor'],
    },
    {
      id: 'action-email-templates',
      label: 'Email Templates',
      description: 'Manage email templates',
      icon: Mail,
      type: 'action',
      action: () => {
        setIsOpen(false);
        window.dispatchEvent(new CustomEvent('openEmailTemplates'));
      },
      keywords: ['templates', 'messages'],
    },
    {
      id: 'action-settings',
      label: 'Settings',
      description: 'System settings and configuration',
      icon: Settings,
      type: 'action',
      action: () => {
        setIsOpen(false);
        router.push('/admin/settings');
      },
      keywords: ['config', 'preferences'],
    },
  ];

  // Filter commands based on search query
  const filteredCommands = searchQuery.trim() === ''
    ? commands.filter(cmd => recentCommands.includes(cmd.id)).length > 0
      ? commands.filter(cmd => recentCommands.includes(cmd.id))
      : commands.slice(0, 5) // Show first 5 commands if no recents
    : commands.filter(cmd => {
        const query = searchQuery.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(query) ||
          cmd.description?.toLowerCase().includes(query) ||
          cmd.keywords?.some(kw => kw.toLowerCase().includes(query))
        );
      });

  // Handle keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      if (isOpen) {
        if (e.key === 'Escape') {
          setIsOpen(false);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Load recent commands from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentCommands');
    if (stored) {
      setRecentCommands(JSON.parse(stored));
    }
  }, []);

  const executeCommand = useCallback((command: CommandItem) => {
    // Add to recent commands
    const updatedRecents = [
      command.id,
      ...recentCommands.filter(id => id !== command.id)
    ].slice(0, 5);
    setRecentCommands(updatedRecents);
    localStorage.setItem('recentCommands', JSON.stringify(updatedRecents));

    // Execute the command
    if (command.type === 'navigation' && command.path) {
      router.push(command.path);
    } else if (command.type === 'action' && command.action) {
      command.action();
    }
    
    setIsOpen(false);
  }, [recentCommands, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      {/* Command Palette */}
      <div className="flex min-h-full items-start justify-center p-4 text-center sm:p-0">
        <div
          ref={containerRef}
          className="relative mt-20 w-full max-w-2xl transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all"
        >
          {/* Search Input */}
          <div className="border-b border-gray-200">
            <div className="flex items-center px-4 py-3">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Type a command or search..."
                className="ml-3 flex-1 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="ml-3 text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Command List */}
          <div className="max-h-96 overflow-y-auto py-2">
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No commands found for "{searchQuery}"
              </div>
            ) : (
              <>
                {searchQuery.trim() === '' && recentCommands.length > 0 && (
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Recent</p>
                  </div>
                )}
                {filteredCommands.map((command, index) => {
                  const Icon = command.icon;
                  const isSelected = index === selectedIndex;
                  
                  return (
                    <button
                      key={command.id}
                      onClick={() => executeCommand(command)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                        isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          isSelected ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            isSelected ? 'text-blue-600' : 'text-gray-500'
                          }`} />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{command.label}</p>
                          {command.description && (
                            <p className="text-xs text-gray-500">{command.description}</p>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <Command className="mr-1 h-3 w-3" />K to open
                </span>
                <span>↑↓ to navigate</span>
                <span>↵ to select</span>
                <span>ESC to close</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
