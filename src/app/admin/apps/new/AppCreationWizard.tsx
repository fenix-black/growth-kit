'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/ui/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import ContentCard from '@/components/ui/ContentCard';
import Button from '@/components/ui/Button';
import { cn } from '@/components/ui/utils';
import { 
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Package,
  Shield,
  Users,
  Coins,
  Eye
} from 'lucide-react';

interface FormData {
  // Basic Info
  name: string;
  domain: string;
  description: string;
  logoUrl: string;
  primaryColor: string;
  waitlistLayout: string;
  
  // CORS & Security
  corsOrigins: string;
  redirectUrl: string;
  requireAuth: boolean;
  
  // Waitlist Settings
  waitlistEnabled: boolean;
  autoApprove: boolean;
  invitationQuota: number;
  invitationCronTime: string;
  
  // Credit Policy
  referralCredits: number;
  referredCredits: number;
  nameClaimCredits: number;
  emailClaimCredits: number;
  emailVerifyCredits: number;
  dailyReferralCap: number;
  
  // Advanced
  trackUsdValue: boolean;
  customActions: string;
}

const steps = [
  { id: 1, name: 'Basic Info', icon: Package, description: 'App name and domain' },
  { id: 2, name: 'Security', icon: Shield, description: 'CORS and authentication' },
  { id: 3, name: 'Waitlist', icon: Users, description: 'Waitlist configuration' },
  { id: 4, name: 'Credits', icon: Coins, description: 'Credit policy settings' },
  { id: 5, name: 'Review', icon: Eye, description: 'Review and confirm' },
];

const templates = [
  {
    name: 'SaaS Starter',
    description: 'Standard configuration for SaaS applications',
    values: {
      waitlistEnabled: true,
      autoApprove: false,
      invitationQuota: 10,
      referralCredits: 5,
      referredCredits: 3,
      dailyReferralCap: 10,
    }
  },
  {
    name: 'Community Platform',
    description: 'Optimized for community-driven growth',
    values: {
      waitlistEnabled: false,
      autoApprove: true,
      invitationQuota: 50,
      referralCredits: 10,
      referredCredits: 5,
      dailyReferralCap: 20,
    }
  },
  {
    name: 'Beta Launch',
    description: 'Controlled rollout with strict waitlist',
    values: {
      waitlistEnabled: true,
      autoApprove: false,
      invitationQuota: 5,
      referralCredits: 3,
      referredCredits: 2,
      dailyReferralCap: 5,
    }
  },
];

export default function AppCreationWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    name: '',
    domain: '',
    description: '',
    logoUrl: '',
    primaryColor: '#10b981',
    waitlistLayout: 'centered',
    corsOrigins: '',
    redirectUrl: '',
    requireAuth: false,
    waitlistEnabled: false,
    autoApprove: false,
    invitationQuota: 10,
    invitationCronTime: '10:00',
    referralCredits: 5,
    referredCredits: 3,
    nameClaimCredits: 2,
    emailClaimCredits: 2,
    emailVerifyCredits: 5,
    dailyReferralCap: 10,
    trackUsdValue: false,
    customActions: '',
  });

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case 1:
        if (!formData.name) newErrors.name = 'App name is required';
        if (!formData.domain) newErrors.domain = 'Domain is required';
        break;
      case 2:
        if (!formData.redirectUrl) newErrors.redirectUrl = 'Redirect URL is required';
        break;
      case 3:
        if (formData.waitlistEnabled && formData.invitationQuota < 1) {
          newErrors.invitationQuota = 'Quota must be at least 1';
        }
        break;
      case 4:
        if (formData.referralCredits < 0) newErrors.referralCredits = 'Credits cannot be negative';
        if (formData.dailyReferralCap < 1) newErrors.dailyReferralCap = 'Cap must be at least 1';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const applyTemplate = (template: typeof templates[0]) => {
    setFormData(prev => ({ ...prev, ...template.values }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const corsOriginsArray = formData.corsOrigins
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const policyJson = {
        referralCredits: formData.referralCredits,
        referredCredits: formData.referredCredits,
        nameClaimCredits: formData.nameClaimCredits,
        emailClaimCredits: formData.emailClaimCredits,
        emailVerifyCredits: formData.emailVerifyCredits,
        dailyReferralCap: formData.dailyReferralCap,
        actions: {
          default: { creditsRequired: 1 }
        }
      };

      // Parse custom actions if provided
      if (formData.customActions) {
        try {
          const customActionsObj = JSON.parse(formData.customActions);
          policyJson.actions = { ...policyJson.actions, ...customActionsObj };
        } catch (e) {
          // Ignore parsing errors for custom actions
        }
      }

      const response = await fetch('/api/v1/admin/app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
        body: JSON.stringify({
          name: formData.name,
          domain: formData.domain,
          description: formData.description,
          logoUrl: formData.logoUrl || null,
          primaryColor: formData.primaryColor,
          waitlistLayout: formData.waitlistLayout,
          corsOrigins: corsOriginsArray,
          redirectUrl: formData.redirectUrl,
          policyJson,
          waitlistEnabled: formData.waitlistEnabled,
          autoApproveWaitlist: formData.autoApprove,
          invitationQuota: formData.invitationQuota,
          invitationCronTime: formData.invitationCronTime,
          trackUsdValue: formData.trackUsdValue,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data.initialApiKey) {
          alert(`App created successfully!\n\nAPI Key: ${data.data.initialApiKey}\n\nIMPORTANT: Save this key now, it won't be shown again!`);
        }
        router.push('/admin/apps');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      alert('Error creating app. Please check your inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                App Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={cn(
                  "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                  errors.name && "border-red-500"
                )}
                placeholder="My Awesome App"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domain *
              </label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className={cn(
                  "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                  errors.domain && "border-red-500"
                )}
                placeholder="app.example.com"
              />
              {errors.domain && (
                <p className="mt-1 text-sm text-red-600">{errors.domain}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Brief description of your app"
              />
              <p className="mt-1 text-sm text-gray-500">
                This will be shown on your waitlist screen
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL (optional)
              </label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://example.com/logo.png"
              />
              <p className="mt-1 text-sm text-gray-500">
                PNG, JPG, or WebP. You can upload later in settings.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Color
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="#10b981"
                />
                <div 
                  className="h-10 w-10 rounded-lg border border-gray-300"
                  style={{ backgroundColor: formData.primaryColor }}
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Used for buttons and accents in the waitlist screen
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Waitlist Layout
              </label>
              <select
                value={formData.waitlistLayout}
                onChange={(e) => setFormData({ ...formData, waitlistLayout: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="centered">Centered (Default)</option>
                <option value="split">Split Layout</option>
                <option value="minimal">Minimal</option>
                <option value="embed">Embed (Widget Mode)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Choose how the waitlist screen will be displayed
              </p>
            </div>

            {/* Templates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quick Start Templates
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => applyTemplate(template)}
                    className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CORS Origins
              </label>
              <input
                type="text"
                value={formData.corsOrigins}
                onChange={(e) => setFormData({ ...formData, corsOrigins: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="http://localhost:3000, https://app.example.com"
              />
              <p className="mt-1 text-sm text-gray-500">
                Comma-separated list of allowed origins
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Redirect URL *
              </label>
              <input
                type="url"
                value={formData.redirectUrl}
                onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                className={cn(
                  "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                  errors.redirectUrl && "border-red-500"
                )}
                placeholder="https://app.example.com/welcome"
              />
              {errors.redirectUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.redirectUrl}</p>
              )}
            </div>

            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.requireAuth}
                  onChange={(e) => setFormData({ ...formData, requireAuth: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Require authentication for API access
                </span>
              </label>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.waitlistEnabled}
                  onChange={(e) => setFormData({ ...formData, waitlistEnabled: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Enable waitlist system
                </span>
              </label>
            </div>

            {formData.waitlistEnabled && (
              <>
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.autoApprove}
                      onChange={(e) => setFormData({ ...formData, autoApprove: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Auto-approve waitlist entries
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Invitation Quota
                  </label>
                  <input
                    type="number"
                    value={formData.invitationQuota}
                    onChange={(e) => setFormData({ ...formData, invitationQuota: parseInt(e.target.value) || 0 })}
                    className={cn(
                      "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                      errors.invitationQuota && "border-red-500"
                    )}
                    min="0"
                  />
                  {errors.invitationQuota && (
                    <p className="mt-1 text-sm text-red-600">{errors.invitationQuota}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invitation Cron Time
                  </label>
                  <input
                    type="time"
                    value={formData.invitationCronTime}
                    onChange={(e) => setFormData({ ...formData, invitationCronTime: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Time when daily invitations are sent
                  </p>
                </div>
              </>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referral Credits
                </label>
                <input
                  type="number"
                  value={formData.referralCredits}
                  onChange={(e) => setFormData({ ...formData, referralCredits: parseInt(e.target.value) || 0 })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referred Credits
                </label>
                <input
                  type="number"
                  value={formData.referredCredits}
                  onChange={(e) => setFormData({ ...formData, referredCredits: parseInt(e.target.value) || 0 })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name Claim Credits
                </label>
                <input
                  type="number"
                  value={formData.nameClaimCredits}
                  onChange={(e) => setFormData({ ...formData, nameClaimCredits: parseInt(e.target.value) || 0 })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Claim Credits
                </label>
                <input
                  type="number"
                  value={formData.emailClaimCredits}
                  onChange={(e) => setFormData({ ...formData, emailClaimCredits: parseInt(e.target.value) || 0 })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Verify Credits
                </label>
                <input
                  type="number"
                  value={formData.emailVerifyCredits}
                  onChange={(e) => setFormData({ ...formData, emailVerifyCredits: parseInt(e.target.value) || 0 })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Referral Cap
                </label>
                <input
                  type="number"
                  value={formData.dailyReferralCap}
                  onChange={(e) => setFormData({ ...formData, dailyReferralCap: parseInt(e.target.value) || 1 })}
                  className={cn(
                    "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                    errors.dailyReferralCap && "border-red-500"
                  )}
                  min="1"
                />
                {errors.dailyReferralCap && (
                  <p className="mt-1 text-sm text-red-600">{errors.dailyReferralCap}</p>
                )}
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.trackUsdValue}
                  onChange={(e) => setFormData({ ...formData, trackUsdValue: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Track USD value for transactions
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Action Credits (JSON)
              </label>
              <textarea
                value={formData.customActions}
                onChange={(e) => setFormData({ ...formData, customActions: e.target.value })}
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-xs"
                placeholder='{"premium_feature": {"creditsRequired": 10}}'
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Review your configuration
                  </h3>
                  <p className="mt-1 text-sm text-blue-700">
                    Please review all settings before creating the app. You can modify these settings later in the app management panel.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Basic Information</h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-gray-500">Name</dt>
                    <dd className="text-sm font-medium text-gray-900">{formData.name || 'Not set'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Domain</dt>
                    <dd className="text-sm font-medium text-gray-900">{formData.domain || 'Not set'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Security Settings</h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-gray-500">Redirect URL</dt>
                    <dd className="text-sm font-medium text-gray-900">{formData.redirectUrl || 'Not set'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Authentication Required</dt>
                    <dd className="text-sm font-medium text-gray-900">{formData.requireAuth ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Waitlist Configuration</h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-gray-500">Waitlist Enabled</dt>
                    <dd className="text-sm font-medium text-gray-900">{formData.waitlistEnabled ? 'Yes' : 'No'}</dd>
                  </div>
                  {formData.waitlistEnabled && (
                    <>
                      <div>
                        <dt className="text-sm text-gray-500">Auto-Approve</dt>
                        <dd className="text-sm font-medium text-gray-900">{formData.autoApprove ? 'Yes' : 'No'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Daily Quota</dt>
                        <dd className="text-sm font-medium text-gray-900">{formData.invitationQuota}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Send Time</dt>
                        <dd className="text-sm font-medium text-gray-900">{formData.invitationCronTime}</dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Credit Policy</h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-gray-500">Referral Credits</dt>
                    <dd className="text-sm font-medium text-gray-900">{formData.referralCredits}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Daily Cap</dt>
                    <dd className="text-sm font-medium text-gray-900">{formData.dailyReferralCap}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Track USD</dt>
                    <dd className="text-sm font-medium text-gray-900">{formData.trackUsdValue ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      apps={[]}
      onLogout={handleLogout}
    >
      <PageHeader 
        title="Create New App"
        description="Set up a new GrowthKit application"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Apps', href: '/admin/apps' },
          { label: 'Create New' }
        ]}
      />

      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <nav aria-label="Progress" className="mb-8">
          <ol className="flex items-center justify-between">
            {steps.map((step, stepIdx) => (
              <li key={step.id} className={cn("relative", stepIdx !== 0 && "pl-8 sm:pl-20 md:pl-32")}>
                {stepIdx !== 0 && (
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className={cn(
                      "h-0.5 w-full",
                      currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
                    )} />
                  </div>
                )}
                <button
                  onClick={() => currentStep >= step.id && setCurrentStep(step.id)}
                  className={cn(
                    "relative flex items-center justify-center",
                    currentStep >= step.id && "cursor-pointer"
                  )}
                  disabled={currentStep < step.id}
                >
                  <span className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center border-2",
                    currentStep > step.id ? "bg-blue-600 border-blue-600" :
                    currentStep === step.id ? "bg-white border-blue-600" :
                    "bg-white border-gray-300"
                  )}>
                    {currentStep > step.id ? (
                      <Check className="h-6 w-6 text-white" />
                    ) : (
                      <step.icon className={cn(
                        "h-6 w-6",
                        currentStep === step.id ? "text-blue-600" : "text-gray-400"
                      )} />
                    )}
                  </span>
                  <span className="absolute -bottom-8 text-xs text-center w-20">
                    <span className={cn(
                      "block font-medium",
                      currentStep === step.id ? "text-blue-600" : "text-gray-500"
                    )}>
                      {step.name}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {/* Form Content */}
        <ContentCard className="mt-12">
          <div className="p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              {steps[currentStep - 1].name}
            </h2>
            
            {renderStepContent()}
            
            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              <Button
                variant="ghost"
                icon={<ChevronLeft size={20} />}
                onClick={currentStep === 1 ? () => router.push('/admin/apps') : handlePrevious}
              >
                {currentStep === 1 ? 'Cancel' : 'Previous'}
              </Button>
              
              {currentStep < 5 ? (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  icon={<ChevronRight size={20} />}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="success"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  icon={<Check size={20} />}
                >
                  Create App
                </Button>
              )}
            </div>
          </div>
        </ContentCard>
      </div>
    </DashboardLayout>
  );
}
