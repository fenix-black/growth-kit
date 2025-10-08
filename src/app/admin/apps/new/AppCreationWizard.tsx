'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
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
  Eye,
  Plus,
  Copy,
  CheckCircle
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
  waitlistMessages: string[];
  backgroundColor: string;
  cardBackgroundColor: string;
  
  // Credit Policy
  referralCredits: number;
  referredCredits: number;
  nameClaimCredits: number;
  emailClaimCredits: number;
  emailVerifyCredits: number;
  dailyReferralCap: number;
  dailyCredits: number;
  
  // Advanced (hidden from wizard, set as defaults)
  trackUsdValue: boolean;
  customActions: string;
  embedSelector?: string;
}

const steps = [
  { id: 1, name: 'Basic Info', icon: Package, description: 'App name, domain and description' },
  { id: 2, name: 'Waitlist Settings', icon: Users, description: 'Waitlist layout and branding' },
  { id: 3, name: 'Credits', icon: Coins, description: 'Template selection and credit policy' },
  { id: 4, name: 'Review', icon: Eye, description: 'Review and confirm' },
];

const templates = [
  {
    name: 'SaaS Starter',
    description: 'Standard configuration for SaaS applications',
    values: {
      referralCredits: 5,
      referredCredits: 3,
      dailyReferralCap: 10,
      dailyCredits: 3,
      emailVerifyCredits: 5,
    }
  },
  {
    name: 'Community Platform',
    description: 'Optimized for community-driven growth',
    values: {
      referralCredits: 10,
      referredCredits: 5,
      dailyReferralCap: 20,
      dailyCredits: 5,
      emailVerifyCredits: 3,
    }
  },
  {
    name: 'Beta Launch',
    description: 'Controlled rollout with conservative credits',
    values: {
      referralCredits: 3,
      referredCredits: 2,
      dailyReferralCap: 5,
      dailyCredits: 2,
      emailVerifyCredits: 3,
    }
  },
];

export default function AppCreationWizard() {
  const router = useRouter();
  const { mutate } = useAdmin();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showAdvancedSecurity, setShowAdvancedSecurity] = useState(false);
  const [showAdvancedCredits, setShowAdvancedCredits] = useState(false);
  
  // Waitlist color controls (matching BrandingCard)
  const [bgColor1, setBgColor1] = useState('#0f172a');
  const [bgColor2, setBgColor2] = useState('#1e293b');
  const [useGradient, setUseGradient] = useState(true);
  const [cardColor, setCardColor] = useState('#ffffff');
  const [cardOpacity, setCardOpacity] = useState(5);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [extractingColors, setExtractingColors] = useState(false);
  const [showPublicKeyModal, setShowPublicKeyModal] = useState(false);
  const [newPublicKey, setNewPublicKey] = useState<string | null>(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  
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
    waitlistEnabled: true, // Default enabled - most apps want waitlists
    autoApprove: false,
    invitationQuota: 10,
    invitationCronTime: '10:00',
    referralCredits: 5,
    referredCredits: 3,
    nameClaimCredits: 2,
    emailClaimCredits: 2,
    emailVerifyCredits: 5,
    dailyReferralCap: 10,
    dailyCredits: 3,
    trackUsdValue: true, // Enable by default, hidden from wizard
    customActions: '',
    waitlistMessages: ['Join our waitlist to get early access!'],
    backgroundColor: '#ffffff',
    cardBackgroundColor: '#f8fafc',
  });

  // Smart defaults: Auto-populate CORS and redirect based on domain
  const updateSmartDefaults = (domain: string) => {
    if (domain) {
      const smartCors = `https://${domain}, http://localhost:3000, http://localhost:3001`;
      setFormData(prev => ({
        ...prev,
        corsOrigins: smartCors,
        redirectUrl: prev.redirectUrl || `https://${domain}`
      }));
    }
  };


  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case 1:
        if (!formData.name) newErrors.name = 'App name is required';
        if (!formData.domain) newErrors.domain = 'Domain is required';
        break;
      case 2:
        // Widget settings - no required fields
        break;
      case 3:
        if (formData.referralCredits < 0) newErrors.referralCredits = 'Credits cannot be negative';
        if (formData.dailyReferralCap < 1) newErrors.dailyReferralCap = 'Cap must be at least 1';
        if (formData.waitlistEnabled && formData.invitationQuota < 1) {
          newErrors.invitationQuota = 'Quota must be at least 1';
        }
        break;
      // Security step removed - validation moved to final submission
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      let nextStep = currentStep + 1;
      
      // Skip Step 2 (Waitlist Settings) if waitlist is disabled  
      if (currentStep === 1 && !formData.waitlistEnabled) {
        nextStep = 3; // Jump to Credits (Security step removed)
      }
      
      setCurrentStep(nextStep);
    }
  };

  const handlePrevious = () => {
    let prevStep = currentStep - 1;
    
    // Skip Step 2 (Waitlist Settings) if waitlist is disabled and we're going back from Step 3
    if (currentStep === 3 && !formData.waitlistEnabled) {
      prevStep = 1; // Jump back to Basic Info
    }
    
    setCurrentStep(prevStep);
  };

  const applyTemplate = (template: typeof templates[0]) => {
    setFormData(prev => ({ ...prev, ...template.values }));
    setSelectedTemplate(template.name);
  };

  // Generate CSS strings from color controls (matching BrandingCard)
  const generateBackgroundColor = () => {
    if (useGradient) {
      return `linear-gradient(135deg, ${bgColor1} 0%, ${bgColor2} 100%)`;
    }
    return bgColor1;
  };
  
  const generateCardColor = () => {
    if (cardOpacity < 100) {
      const hex = cardColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${cardOpacity / 100})`;
    }
    return cardColor;
  };

  // Extract colors from uploaded logo
  const extractColorsFromLogo = (file: File) => {
    return new Promise<string[]>((resolve) => {
      setExtractingColors(true);
      
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        // Resize canvas to reasonable size for processing
        const maxSize = 100;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData?.data;
        
        if (!data) {
          resolve([]);
          return;
        }
        
        // Color frequency map
        const colorMap = new Map<string, number>();
        
        // Sample every few pixels for performance
        for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          // Skip transparent/near-transparent pixels
          if (a < 128) continue;
          
          // Skip very dark/light colors (likely text/background)
          const brightness = (r + g + b) / 3;
          if (brightness < 30 || brightness > 225) continue;
          
          // Round colors to reduce noise
          const roundedR = Math.round(r / 16) * 16;
          const roundedG = Math.round(g / 16) * 16;
          const roundedB = Math.round(b / 16) * 16;
          
          const colorKey = `${roundedR},${roundedG},${roundedB}`;
          colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
        }
        
        // Get top colors by frequency
        const sortedColors = Array.from(colorMap.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([rgb]) => {
            const [r, g, b] = rgb.split(',').map(Number);
            return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
          });
        
        setExtractingColors(false);
        resolve(sortedColors);
      };
      
      img.onerror = () => {
        setExtractingColors(false);
        resolve([]);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Apply extracted colors as smart defaults
  const applyExtractedColors = async (colors: string[]) => {
    if (colors.length === 0) return;
    
    const [primary, secondary, tertiary] = colors;
    
    // Set brand color to most vibrant
    setFormData(prev => ({ ...prev, primaryColor: primary }));
    
    // Create dark gradient background using extracted colors
    if (secondary) {
      setBgColor1(primary);
      setBgColor2(secondary);
      setUseGradient(true);
    } else {
      setBgColor1(primary);
      setUseGradient(false);
    }
    
    // Set card to light color that complements with good readability for branded content
    setCardColor('#ffffff');
    setCardOpacity(95); // Solid background for good logo/text readability
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLogoFile(file);
    
    // Extract colors and apply as defaults
    try {
      const colors = await extractColorsFromLogo(file);
      if (colors.length > 0) {
        await applyExtractedColors(colors);
      }
    } catch (error) {
      console.error('Error extracting colors:', error);
    }
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
        invitationCredits: formData.dailyCredits, // Credits given to new visitors (same as daily credits)
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

      const response = await fetch('/api/admin/apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        // Refresh the apps cache to show the new app in sidebar
        mutate();
        
        if (data.data.publicKey) {
          // Show public key modal instead of alert
          setNewPublicKey(data.data.publicKey);
          setShowPublicKeyModal(true);
        } else {
          router.push('/admin/apps');
        }
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
                onChange={(e) => {
                  const domain = e.target.value;
                  setFormData({ ...formData, domain });
                  updateSmartDefaults(domain);
                }}
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
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Brief description of your app (optional)"
              />
            </div>


            {/* Waitlist Toggle - Key Decision */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div>
                <label className="flex items-center space-x-3 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.waitlistEnabled}
                    onChange={(e) => setFormData({ ...formData, waitlistEnabled: e.target.checked })}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 scale-125"
                  />
                  <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Enable waitlist for this app
                  </span>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 ml-8">
                  Waitlists help build anticipation and manage app launch. Recommended for most apps.
                </p>
              </div>
            </div>

            {/* Show smart-populated preview if domain is set */}
            {formData.domain && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-emerald-900 dark:text-emerald-100 mb-2">
                  ✨ We'll auto-configure these for you:
                </h4>
                <div className="text-sm text-emerald-800 dark:text-emerald-200 space-y-1">
                  <div>• CORS origins for {formData.domain} + localhost</div>
                  <div>• Redirect URL: https://{formData.domain}</div>
                  <div>• {formData.waitlistEnabled ? 'Waitlist with good defaults' : 'No waitlist - direct access'}</div>
                  <div>• Sensible credit policy</div>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        // Only show this step if waitlist is enabled
        if (!formData.waitlistEnabled) {
          return null; // This step will be skipped
        }
        
        return (
          <div className="space-y-6">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-emerald-900 dark:text-emerald-100 mb-2">
                🎉 Waitlist enabled! Let's configure how it looks
              </h4>
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                Your waitlist will help build anticipation and manage your app launch
              </p>
            </div>

            {/* Logo Upload with Color Extraction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Logo (optional)
              </label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-300"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Upload PNG, JPG, or WebP. Colors will be auto-extracted for your theme.
                </p>
                
                {/* Logo Preview and Color Extraction */}
                {logoFile && (
                  <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                        <img 
                          src={URL.createObjectURL(logoFile)} 
                          alt="Logo preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                          {logoFile.name}
                        </p>
                        {extractingColors ? (
                          <p className="text-xs text-emerald-700 dark:text-emerald-300">
                            🎨 Extracting brand colors...
                          </p>
                        ) : (
                          <p className="text-xs text-emerald-700 dark:text-emerald-300">
                            ✨ Colors extracted and applied!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Waitlist Layout
              </label>
              <div className="grid grid-cols-2 gap-4">
                {['centered', 'split', 'minimal', 'embed'].map((layout) => (
                  <button
                    key={layout}
                    type="button"
                    onClick={() => setFormData({ ...formData, waitlistLayout: layout })}
                    className={cn(
                      "p-4 border rounded-lg text-center transition-all duration-200",
                      formData.waitlistLayout === layout
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500 ring-opacity-20"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                    )}
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize mb-1">
                      {layout === 'embed' ? 'Embed Mode' : layout}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {layout === 'centered' && 'Classic center layout'}
                      {layout === 'split' && 'Split screen design'} 
                      {layout === 'minimal' && 'Clean minimal style'}
                      {layout === 'embed' && 'Widget for existing pages'}
                    </div>
                  </button>
                ))}
              </div>

              {/* CSS Selector for Embed Mode */}
              {formData.waitlistLayout === 'embed' && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CSS Selector for Embed Container
                  </label>
                  <input
                    type="text"
                    value={formData.embedSelector || ''}
                    onChange={(e) => setFormData({ ...formData, embedSelector: e.target.value })}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-white dark:text-gray-900"
                    placeholder="#waitlist-container"
                  />
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                    CSS selector where the waitlist widget will be embedded (e.g., "#waitlist-container", ".embed-here")
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Brand Color
              </label>
              <div className="flex gap-4 items-center">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="h-12 w-20 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="block w-32 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="#10b981"
                />
                <div 
                  className="h-12 w-12 rounded-lg border border-gray-300 flex items-center justify-center"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  <Check className="text-white" size={16} />
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                This color will be used for buttons and accents in your waitlist
              </p>
            </div>

            {/* Background Colors with Gradient Support */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Background
              </label>
              
              {/* Preset Options - Only show if no logo uploaded */}
              {!logoFile && (
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setBgColor1('#0f172a');
                      setBgColor2('#1e293b');
                      setUseGradient(true);
                    }}
                    className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                    title="Dark (Default)"
                  >
                    <div className="h-8 rounded" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }} />
                    <p className="text-xs mt-1 text-center text-gray-600 dark:text-gray-400">Dark</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBgColor1('#f9fafb');
                      setBgColor2('#e5e7eb');
                      setUseGradient(true);
                    }}
                    className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                    title="Light"
                  >
                    <div className="h-8 rounded border border-gray-200" style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)' }} />
                    <p className="text-xs mt-1 text-center text-gray-600 dark:text-gray-400">Light</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBgColor1('#1e3a8a');
                      setBgColor2('#312e81');
                      setUseGradient(true);
                    }}
                    className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                    title="Ocean"
                  >
                    <div className="h-8 rounded" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)' }} />
                    <p className="text-xs mt-1 text-center text-gray-600 dark:text-gray-400">Ocean</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBgColor1('#7c2d12');
                      setBgColor2('#991b1b');
                      setUseGradient(true);
                    }}
                    className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                    title="Sunset"
                  >
                    <div className="h-8 rounded" style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #991b1b 100%)' }} />
                    <p className="text-xs mt-1 text-center text-gray-600 dark:text-gray-400">Sunset</p>
                  </button>
                </div>
              )}

              {/* Show hint when logo is uploaded */}
              {logoFile && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    🎨 Using colors extracted from your logo. You can still customize below if needed.
                  </p>
                </div>
              )}

              {/* Custom Background Controls */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="useGradient"
                    checked={useGradient}
                    onChange={(e) => setUseGradient(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="useGradient" className="text-sm text-gray-600 dark:text-gray-400">
                    Use gradient (two colors)
                  </label>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {useGradient ? 'Color 1' : 'Background Color'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={bgColor1}
                        onChange={(e) => setBgColor1(e.target.value)}
                        className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={bgColor1}
                        onChange={(e) => setBgColor1(e.target.value)}
                        className="flex-1 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                  
                  {useGradient && (
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Color 2</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={bgColor2}
                          onChange={(e) => setBgColor2(e.target.value)}
                          className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={bgColor2}
                          onChange={(e) => setBgColor2(e.target.value)}
                          className="flex-1 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card Background with Opacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Card Background
              </label>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={cardColor}
                        onChange={(e) => setCardColor(e.target.value)}
                        className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cardColor}
                        onChange={(e) => setCardColor(e.target.value)}
                        className="flex-1 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                  
                  <div className="w-32">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Opacity (%)</label>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={cardOpacity}
                      onChange={(e) => setCardOpacity(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-center text-gray-500 dark:text-gray-400">{cardOpacity}%</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Lower opacity creates a glass/blur effect (recommended: 5-15%)
                </p>
              </div>
            </div>

            {/* Custom Messages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Custom Messages
              </label>
              <div className="space-y-2">
                {formData.waitlistMessages.map((message, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => {
                        const newMessages = [...formData.waitlistMessages];
                        newMessages[index] = e.target.value;
                        setFormData({ ...formData, waitlistMessages: newMessages });
                      }}
                      className="flex-1 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Enter a custom message for your waitlist"
                    />
                    {formData.waitlistMessages.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newMessages = formData.waitlistMessages.filter((_, i) => i !== index);
                          setFormData({ ...formData, waitlistMessages: newMessages });
                        }}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData({ 
                    ...formData, 
                    waitlistMessages: [...formData.waitlistMessages, ''] 
                  })}
                  icon={<Plus size={16} />}
                >
                  Add Message
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Custom messages shown to users on the waitlist page
              </p>
            </div>

            {/* Combined Waitlist Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Preview
              </label>
              <div className="p-8 rounded-lg border border-gray-200" style={{ background: generateBackgroundColor() }}>
                <div 
                  className="p-6 rounded-lg shadow-lg max-w-md mx-auto text-center" 
                  style={{ 
                    background: generateCardColor(), 
                    backdropFilter: cardOpacity < 100 ? 'blur(10px)' : 'none' 
                  }}
                >
                  {logoFile && (
                    <div className="w-12 h-12 mx-auto mb-3 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                      <img 
                        src={URL.createObjectURL(logoFile)} 
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold mb-2" style={{ color: formData.primaryColor }}>
                    {formData.name || 'Your App Name'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {formData.waitlistMessages[0] || 'Join our waitlist to get early access!'}
                  </p>
                  <button 
                    className="px-6 py-2 rounded-lg text-white font-medium shadow-sm"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    Join Waitlist
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Waitlist Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Advanced Settings
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.autoApprove}
                      onChange={(e) => setFormData({ ...formData, autoApprove: e.target.checked })}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Auto-approve waitlist entries
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                    Users get immediate access vs manual approval
                  </p>
                </div>


                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Daily Invitation Quota
                    </label>
                    <input
                      type="number"
                      value={formData.invitationQuota}
                      onChange={(e) => setFormData({ ...formData, invitationQuota: parseInt(e.target.value) || 0 })}
                      className={cn(
                        "block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white",
                        errors.invitationQuota && "border-red-500"
                      )}
                      min="0"
                    />
                    {errors.invitationQuota && (
                      <p className="mt-1 text-sm text-red-600">{errors.invitationQuota}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      How many invitations to send daily from waitlist
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Invitation Send Time
                    </label>
                    <input
                      type="time"
                      value={formData.invitationCronTime}
                      onChange={(e) => setFormData({ ...formData, invitationCronTime: e.target.value })}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Time when daily invitations are sent (UTC)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Template Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {templates.map((template) => (
                <button
                  key={template.name}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className={cn(
                    "text-left p-4 border rounded-lg transition-all duration-200 relative",
                    selectedTemplate === template.name
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500 ring-opacity-20"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  )}
                >
                  {selectedTemplate === template.name && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-5 w-5 text-emerald-500" />
                    </div>
                  )}
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {template.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {template.description}
                  </p>
                  
                  {/* Credit values preview */}
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div>Referral Credits: <strong>{template.values.referralCredits}</strong></div>
                    <div>Referred Credits: <strong>{template.values.referredCredits}</strong></div>
                    <div>Daily Credits: <strong>{template.values.dailyCredits}</strong></div>
                    <div>Daily Cap: <strong>{template.values.dailyReferralCap}</strong></div>
                  </div>
                </button>
              ))}
            </div>

            {/* Credit Values */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Referral Credits
                </label>
                <input
                  type="number"
                  value={formData.referralCredits}
                  onChange={(e) => setFormData({ ...formData, referralCredits: parseInt(e.target.value) || 0 })}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  min="0"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Credits earned by referrer</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Referred Credits
                </label>
                <input
                  type="number"
                  value={formData.referredCredits}
                  onChange={(e) => setFormData({ ...formData, referredCredits: parseInt(e.target.value) || 0 })}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  min="0"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Credits earned by referred user</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Daily Credits
                </label>
                <input
                  type="number"
                  value={formData.dailyCredits}
                  onChange={(e) => setFormData({ ...formData, dailyCredits: parseInt(e.target.value) || 0 })}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  min="0"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Credits given daily for visiting</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Daily Referral Cap
                </label>
                <input
                  type="number"
                  value={formData.dailyReferralCap}
                  onChange={(e) => setFormData({ ...formData, dailyReferralCap: parseInt(e.target.value) || 1 })}
                  className={cn(
                    "block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white",
                    errors.dailyReferralCap && "border-red-500"
                  )}
                  min="1"
                />
                {errors.dailyReferralCap && (
                  <p className="mt-1 text-sm text-red-600">{errors.dailyReferralCap}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max referrals per day</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Verify Credits
                </label>
                <input
                  type="number"
                  value={formData.emailVerifyCredits}
                  onChange={(e) => setFormData({ ...formData, emailVerifyCredits: parseInt(e.target.value) || 0 })}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  min="0"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Credits for email verification</p>
              </div>

              <div>
                {/* Empty grid item for 2x3 layout */}
              </div>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              💡 Advanced settings like custom actions and name/email claim credits can be configured later in app settings
            </div>
          </div>
        );

      case 4:
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

            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Basic Information</h4>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">App Name</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Domain</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.domain}</dd>
                  </div>
                  {formData.description && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Description</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.description}</dd>
                    </div>
                  )}
                  {logoFile && (
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Logo</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                            <img 
                              src={URL.createObjectURL(logoFile)} 
                              alt="Logo"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          {logoFile.name}
                        </div>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Waitlist Configuration (only if enabled) */}
              {formData.waitlistEnabled && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Waitlist Settings</h4>
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Layout</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                        {formData.waitlistLayout === 'embed' ? 'Embed Mode' : formData.waitlistLayout}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Brand Color</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: formData.primaryColor }}
                          />
                          {formData.primaryColor}
                        </div>
                      </dd>
                    </div>
                    {formData.autoApprove !== undefined && (
                      <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Auto-Approve</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.autoApprove ? 'Yes' : 'No'}</dd>
                      </div>
                    )}
                    {formData.invitationQuota > 0 && (
                      <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Daily Invitation Quota</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.invitationQuota}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Credit Policy */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Credit Policy
                  {selectedTemplate && (
                    <span className="ml-2 text-sm font-normal text-emerald-600 dark:text-emerald-400">
                      (using {selectedTemplate} template)
                    </span>
                  )}
                </h4>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Referral Credits</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.referralCredits}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Referred Credits</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.referredCredits}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Daily Credits</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.dailyCredits}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Daily Referral Cap</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.dailyReferralCap}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Email Verify Credits</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.emailVerifyCredits}</dd>
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
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Plus className="w-8 h-8" style={{ color: '#10b981' }} />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create New App</h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Set up a new GrowthKit application with smart defaults
        </p>
      </div>

      <div className="flex gap-8 max-w-7xl mx-auto">
        {/* Left Sidebar - Progress & Tips */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Progress
            </h3>
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                    currentStep > step.id
                      ? "bg-emerald-500 text-white"
                      : currentStep === step.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                  )}>
                    {currentStep > step.id ? <Check size={14} /> : step.id}
                  </div>
                  <span className={cn(
                    "ml-3 text-sm",
                    currentStep >= step.id
                      ? "text-gray-900 dark:text-gray-100 font-medium"
                      : "text-gray-500 dark:text-gray-400"
                  )}>
                    {step.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Current Step Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              💡 Step {currentStep} Tips
            </h4>
            <div className="text-xs text-blue-800 dark:text-blue-200">
              {currentStep === 1 && "Enter your app basics and decide if you want a waitlist."}
              {currentStep === 2 && "Configure your waitlist appearance and behavior."}
              {currentStep === 3 && "Choose a template to set smart credit defaults, or customize manually."}
              {currentStep === 4 && "Review everything before creating your app."}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 max-w-3xl">
          <ContentCard>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {steps[currentStep - 1].name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {steps[currentStep - 1].description}
                  </p>
                </div>
{/* Template indicator moved to page header only */}
              </div>
              
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
                
                {currentStep < 4 ? (
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
      </div>

      {/* Public Key Success Modal */}
      {showPublicKeyModal && newPublicKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              🎉 App Created Successfully!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Your app <strong>{formData.name}</strong> is ready to use. Here's your public token for client-side integration:
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
              💡 Use this public token in your client application (React, Next.js, etc.). It's safe to expose in your frontend code.
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 mb-4">
              <code className="text-sm text-gray-900 dark:text-gray-100 break-all font-mono">
                {newPublicKey}
              </code>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(newPublicKey);
                  setShowCopySuccess(true);
                  setTimeout(() => setShowCopySuccess(false), 2000);
                }}
                icon={showCopySuccess ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
              >
                {showCopySuccess ? 'Copied!' : 'Copy Public Token'}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowPublicKeyModal(false);
                  setNewPublicKey(null);
                  router.push('/admin/apps');
                }}
              >
                Continue to Apps
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
