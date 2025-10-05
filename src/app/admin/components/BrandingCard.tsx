'use client';

import { useState } from 'react';
import ContentCard from '@/components/ui/ContentCard';
import Button from '@/components/ui/Button';
import { cn } from '@/components/ui/utils';
import { Upload, X, Save, Image as ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface BrandingCardProps {
  appId: string;
  logoUrl?: string;
  primaryColor?: string;
  backgroundColor?: string;
  cardBackgroundColor?: string;
  waitlistLayout?: string;
  waitlistMessages?: string[];
  waitlistTargetSelector?: string;
  hideGrowthKitBranding?: boolean;
  autoApprove?: boolean;
  invitationQuota?: number;
  invitationTime?: string;
  onUpdate: () => void;
}

export default function BrandingCard({
  appId,
  logoUrl,
  primaryColor,
  backgroundColor,
  cardBackgroundColor,
  waitlistLayout,
  waitlistMessages,
  waitlistTargetSelector,
  hideGrowthKitBranding,
  autoApprove,
  invitationQuota,
  invitationTime,
  onUpdate,
}: BrandingCardProps) {
  const [editedLogoUrl, setEditedLogoUrl] = useState(logoUrl || '');
  const [editedPrimaryColor, setEditedPrimaryColor] = useState(primaryColor || '#10b981');
  const [editedAutoApprove, setEditedAutoApprove] = useState(autoApprove || false);
  const [editedInvitationQuota, setEditedInvitationQuota] = useState(invitationQuota || 10);
  const [editedInvitationTime, setEditedInvitationTime] = useState(invitationTime || '12:00');
  
  // Parse existing colors or use defaults
  const parseBackgroundColor = (color: string | undefined) => {
    if (!color) return { color1: '#0f172a', color2: '#1e293b', useGradient: true };
    if (color.includes('gradient')) {
      const matches = color.match(/#[0-9a-f]{6}/gi);
      return {
        color1: matches?.[0] || '#0f172a',
        color2: matches?.[1] || '#1e293b',
        useGradient: true
      };
    }
    return { color1: color, color2: '#1e293b', useGradient: false };
  };
  
  const parseCardColor = (color: string | undefined) => {
    if (!color) return { color: '#ffffff', opacity: 5 };
    if (color.includes('rgba')) {
      const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        const a = parseFloat(match[4]);
        const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
        return { color: hex, opacity: Math.round(a * 100) };
      }
    }
    return { color: color, opacity: 100 };
  };
  
  const bgParsed = parseBackgroundColor(backgroundColor);
  const cardParsed = parseCardColor(cardBackgroundColor);
  
  const [bgColor1, setBgColor1] = useState(bgParsed.color1);
  const [bgColor2, setBgColor2] = useState(bgParsed.color2);
  const [useGradient, setUseGradient] = useState(bgParsed.useGradient);
  const [cardColor, setCardColor] = useState(cardParsed.color);
  const [cardOpacity, setCardOpacity] = useState(cardParsed.opacity);
  
  const [editedWaitlistLayout, setEditedWaitlistLayout] = useState(waitlistLayout || 'centered');
  const [editedWaitlistMessages, setEditedWaitlistMessages] = useState<string[]>(waitlistMessages || []);
  const [editedTargetSelector, setEditedTargetSelector] = useState(waitlistTargetSelector || '');
  const [newMessage, setNewMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractingColors, setExtractingColors] = useState(false);
  const [extractedFromLogo, setExtractedFromLogo] = useState(false);
  
  // Generate CSS strings from controls
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
      return `rgba(${r}, ${g}, ${b}, ${(cardOpacity / 100).toFixed(2)})`;
    }
    return cardColor;
  };

  // Extract colors from uploaded logo (same as app creation wizard)
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
        for (let i = 0; i < data.length; i += 16) {
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
    
    const [primary, secondary] = colors;
    
    // Set accent color to most vibrant
    setEditedPrimaryColor(primary);
    
    // Create gradient background using extracted colors
    if (secondary) {
      setBgColor1(primary);
      setBgColor2(secondary);
      setUseGradient(true);
    } else {
      setBgColor1(primary);
      setUseGradient(false);
    }
    
    // Set card to light color with good opacity for readability
    setCardColor('#ffffff');
    setCardOpacity(95);
    setExtractedFromLogo(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!acceptedTypes.includes(file.type)) {
      setUploadError('Only PNG, JPG, and WebP images are allowed. SVG is not supported for security reasons.');
      return;
    }

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be under 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Compress image
      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 512,
        useWebWorker: true,
        fileType: 'image/webp',
      };

      const compressedFile = await imageCompression(file, options);

      // Upload to server
      const formData = new FormData();
      formData.append('file', compressedFile);

      const response = await fetch(`/api/v1/admin/app/${appId}/logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setEditedLogoUrl(data.data.logoUrl);
        setUploadError(null);
        
        // Extract colors from uploaded file and apply as defaults
        try {
          const colors = await extractColorsFromLogo(compressedFile);
          if (colors.length > 0) {
            await applyExtractedColors(colors);
          }
        } catch (error) {
          console.error('Error extracting colors:', error);
        }
      } else {
        const error = await response.json();
        const errorMessage = error.message || 'Failed to upload logo';
        
        // Show helpful message if Blob is not configured
        if (errorMessage.includes('Vercel Blob')) {
          setUploadError('File upload is not configured on this server. Please use the URL option below to add a logo hosted externally.');
        } else {
          setUploadError(errorMessage);
        }
      }
    } catch (error) {
      setUploadError('Error uploading file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setEditedLogoUrl('');
  };

  const handleAddMessage = () => {
    if (newMessage.trim()) {
      setEditedWaitlistMessages([...editedWaitlistMessages, newMessage.trim()]);
      setNewMessage('');
    }
  };

  const handleRemoveMessage = (index: number) => {
    setEditedWaitlistMessages(editedWaitlistMessages.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/v1/admin/app`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
        body: JSON.stringify({
          id: appId,
          logoUrl: editedLogoUrl || null,
          primaryColor: editedPrimaryColor,
          backgroundColor: generateBackgroundColor(),
          cardBackgroundColor: generateCardColor(),
          waitlistLayout: editedWaitlistLayout,
          waitlistMessages: editedWaitlistMessages,
          autoApproveWaitlist: editedAutoApprove,
          invitationQuota: editedInvitationQuota,
          invitationCronTime: editedInvitationTime,
          metadata: {
            waitlistTargetSelector: editedTargetSelector || null,
          },
        }),
      });

      if (response.ok) {
        onUpdate();
      } else {
        alert('Failed to save branding settings');
      }
    } catch (error) {
      alert('Error saving branding settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ContentCard title="Waitlist Display Settings" className="mt-6">
      <div className="space-y-6 p-6">

        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            App Logo
          </label>
          
          <div className="space-y-4">
            {/* Current Logo Preview */}
            {editedLogoUrl && (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={editedLogoUrl}
                    alt="App logo"
                    className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                  />
                  <button
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  Current logo
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div>
              <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition">
                <Upload size={16} className="mr-2" />
                {isUploading ? 'Uploading...' : extractingColors ? 'Extracting colors...' : 'Upload Logo'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  disabled={isUploading || extractingColors}
                  className="hidden"
                />
              </label>
              <p className="mt-2 text-sm text-gray-500">
                PNG, JPG, or WebP. Max 5MB. Colors will be auto-extracted for themes.
              </p>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Or use external URL
              </label>
              <input
                type="url"
                value={editedLogoUrl}
                onChange={(e) => setEditedLogoUrl(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://example.com/logo.png"
              />
            </div>

            {uploadError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {uploadError}
              </div>
            )}
          </div>
        </div>

        {/* Color Presets - Hide if colors extracted from logo or if logo already exists */}
        {!extractedFromLogo && !editedLogoUrl && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Presets
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setBgColor1('#0f172a');
                  setBgColor2('#1e293b');
                  setUseGradient(true);
                  setCardColor('#ffffff');
                  setCardOpacity(5);
                  setEditedPrimaryColor('#10b981');
                }}
                className="p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition"
                title="Dark (Default)"
              >
                <div className="h-8 rounded" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }} />
                <p className="text-xs mt-1 text-center text-gray-600">Dark</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setBgColor1('#f9fafb');
                  setBgColor2('#e5e7eb');
                  setUseGradient(true);
                  setCardColor('#ffffff');
                  setCardOpacity(100);
                  setEditedPrimaryColor('#1874ec');
                }}
                className="p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition"
                title="Light"
              >
                <div className="h-8 rounded border border-gray-200" style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)' }} />
                <p className="text-xs mt-1 text-center text-gray-600">Light</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setBgColor1('#1e3a8a');
                  setBgColor2('#312e81');
                  setUseGradient(true);
                  setCardColor('#ffffff');
                  setCardOpacity(10);
                  setEditedPrimaryColor('#60a5fa');
                }}
                className="p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition"
                title="Ocean"
              >
                <div className="h-8 rounded" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)' }} />
                <p className="text-xs mt-1 text-center text-gray-600">Ocean</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setBgColor1('#7c2d12');
                  setBgColor2('#991b1b');
                  setUseGradient(true);
                  setCardColor('#ffffff');
                  setCardOpacity(10);
                  setEditedPrimaryColor('#fb923c');
                }}
                className="p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition"
                title="Sunset"
              >
                <div className="h-8 rounded" style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #991b1b 100%)' }} />
                <p className="text-xs mt-1 text-center text-gray-600">Sunset</p>
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Click a preset to quickly apply a theme, then customize below.
            </p>
          </div>
        )}

        {/* Show extracted colors hint */}
        {extractedFromLogo && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              🎨 Using colors extracted from your logo. You can still customize below if needed.
            </p>
          </div>
        )}

        {/* Colors */}
        <div className="space-y-6">
          {/* Accent Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accent Color (Buttons & Highlights)
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={editedPrimaryColor}
                onChange={(e) => setEditedPrimaryColor(e.target.value)}
                className="h-12 w-16 rounded-lg border border-gray-300 cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={editedPrimaryColor}
                  onChange={(e) => setEditedPrimaryColor(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="#10b981"
                />
              </div>
            </div>
          </div>

          {/* Background Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background
            </label>
            
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="useGradient"
                checked={useGradient}
                onChange={(e) => setUseGradient(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="useGradient" className="text-sm text-gray-600">
                Use gradient (two colors)
              </label>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={bgColor1}
                  onChange={(e) => setBgColor1(e.target.value)}
                  className="h-12 w-16 rounded-lg border border-gray-300 cursor-pointer"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={bgColor1}
                    onChange={(e) => setBgColor1(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    placeholder="#0f172a"
                  />
                  {!useGradient && <p className="text-xs text-gray-500 mt-1">Solid background color</p>}
                  {useGradient && <p className="text-xs text-gray-500 mt-1">Start color</p>}
                </div>
              </div>
              
              {useGradient && (
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={bgColor2}
                    onChange={(e) => setBgColor2(e.target.value)}
                    className="h-12 w-16 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={bgColor2}
                      onChange={(e) => setBgColor2(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      placeholder="#1e293b"
                    />
                    <p className="text-xs text-gray-500 mt-1">End color</p>
                  </div>
                </div>
              )}
            </div>
            
          </div>

          {/* Card Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Background
            </label>
            
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={cardColor}
                  onChange={(e) => setCardColor(e.target.value)}
                  className="h-12 w-16 rounded-lg border border-gray-300 cursor-pointer"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={cardColor}
                    onChange={(e) => setCardColor(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    placeholder="#ffffff"
                  />
                  <p className="text-xs text-gray-500 mt-1">Card color</p>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-600">Opacity</label>
                  <span className="text-sm font-medium text-gray-900">{cardOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={cardOpacity}
                  onChange={(e) => setCardOpacity(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower opacity creates a glass/blur effect (recommended: 5-15%)
                </p>
              </div>
            </div>
            
            {/* Layout-Specific Preview */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Preview ({editedWaitlistLayout})
              </label>
              
              {/* Centered Layout Preview */}
              {editedWaitlistLayout === 'centered' && (
                <div className="aspect-video rounded-lg border border-gray-200 overflow-hidden" style={{ background: generateBackgroundColor() }}>
                  <div className="h-full flex items-center justify-center p-4">
                    {editedLogoUrl && (
                      <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <img src={editedLogoUrl} alt="Logo" className="w-6 h-6 object-contain" />
                      </div>
                    )}
                    <div 
                      className="p-4 rounded-lg shadow-lg max-w-xs text-center relative" 
                      style={{ 
                        background: generateCardColor(), 
                        backdropFilter: cardOpacity < 100 ? 'blur(10px)' : 'none' 
                      }}
                    >
                      <h3 className="text-sm font-semibold mb-2 text-white">Your App</h3>
                      <p className="text-xs text-gray-300 mb-3">{editedWaitlistMessages[0] || 'Join our waitlist!'}</p>
                      <div className="bg-white/20 h-6 rounded mb-2"></div>
                      <div className="h-6 rounded text-white text-xs flex items-center justify-center" style={{ backgroundColor: editedPrimaryColor }}>
                        Join Waitlist
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Split Layout Preview */}
              {editedWaitlistLayout === 'split' && (
                <div className="aspect-video rounded-lg border border-gray-200 overflow-hidden">
                  <div className="h-full flex">
                    <div className="flex-1 p-4 flex flex-col justify-center" style={{ background: generateBackgroundColor() }}>
                      {editedLogoUrl && (
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mb-2 shadow-sm">
                          <img src={editedLogoUrl} alt="Logo" className="w-6 h-6 object-contain" />
                        </div>
                      )}
                      <h3 className="text-sm font-bold text-white mb-1">Your App</h3>
                      <p className="text-xs text-gray-300">{editedWaitlistMessages[0] || 'Join our waitlist!'}</p>
                    </div>
                    <div className="flex-1 bg-white p-4 flex flex-col justify-center">
                      <h4 className="text-sm font-bold text-gray-900 mb-2">Get Early Access</h4>
                      <div className="bg-gray-100 h-6 rounded mb-2"></div>
                      <div className="h-6 rounded text-white text-xs flex items-center justify-center" style={{ backgroundColor: editedPrimaryColor }}>
                        Join Waitlist
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Minimal Layout Preview */}
              {editedWaitlistLayout === 'minimal' && (
                <div className="aspect-video rounded-lg border border-gray-200 bg-white overflow-hidden">
                  <div className="h-full flex items-center justify-center p-6">
                    <div className="max-w-xs text-center">
                      {editedLogoUrl && (
                        <div className="w-10 h-10 bg-gray-50 border rounded-lg flex items-center justify-center mb-3 mx-auto shadow-sm">
                          <img src={editedLogoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                        </div>
                      )}
                      <h3 className="text-sm font-bold text-gray-900 mb-1">Your App</h3>
                      <p className="text-xs text-gray-600 mb-3">{editedWaitlistMessages[0] || 'Join our waitlist!'}</p>
                      <div className="bg-gray-100 h-6 rounded mb-2"></div>
                      <div className="h-6 rounded text-white text-xs flex items-center justify-center" style={{ backgroundColor: editedPrimaryColor }}>
                        Join
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Embed Layout Preview */}
              {editedWaitlistLayout === 'embed' && (
                <div className="aspect-video rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                  <div className="h-full flex items-center justify-center p-4">
                    <div className="bg-white border rounded-lg p-4 shadow-sm max-w-xs">
                      {editedLogoUrl && (
                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center mb-2 shadow-sm">
                          <img src={editedLogoUrl} alt="Logo" className="w-6 h-6 object-contain" />
                        </div>
                      )}
                      <h4 className="text-sm font-semibold mb-1" style={{ color: editedPrimaryColor }}>Your App</h4>
                      <p className="text-xs text-gray-600 mb-3">{editedWaitlistMessages[0] || 'Join our waitlist!'}</p>
                      <div className="flex gap-2 mb-2">
                        <div className="flex-1 bg-gray-100 h-5 rounded"></div>
                        <div className="h-5 px-3 rounded text-white text-xs flex items-center justify-center" style={{ backgroundColor: editedPrimaryColor }}>
                          Join
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">No spam, unsubscribe anytime</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Waitlist Layout - Visual Selection like in wizard */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Waitlist Layout
          </label>
          <div className="grid grid-cols-2 gap-4">
            {['centered', 'split', 'minimal', 'embed'].map((layout) => (
              <button
                key={layout}
                type="button"
                onClick={() => setEditedWaitlistLayout(layout)}
                className={cn(
                  "p-4 border rounded-lg text-center transition-all duration-200",
                  editedWaitlistLayout === layout
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
        </div>

        {/* Target Selector (only for embed mode) - Styled like wizard */}
        {editedWaitlistLayout === 'embed' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CSS Selector for Embed Container
            </label>
            <input
              type="text"
              value={editedTargetSelector}
              onChange={(e) => setEditedTargetSelector(e.target.value)}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-white dark:text-gray-900 font-mono text-sm"
              placeholder="#waitlist-container"
            />
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
              CSS selector where the waitlist widget will be embedded (e.g., "#waitlist-container", ".embed-here")
            </p>
          </div>
        )}

        {/* Waitlist Messages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Waitlist Messages
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Add custom messages that will be randomly shown on the waitlist screen. 
            If count &lt; 500, messages are shown. If count ≥ 500, count is displayed instead.
          </p>
          
          {/* Message List */}
          {editedWaitlistMessages.length > 0 && (
            <div className="space-y-2 mb-3">
              {editedWaitlistMessages.map((msg, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded-md">
                  <span className="flex-1 text-sm text-gray-700">{msg}</span>
                  <button
                    onClick={() => handleRemoveMessage(index)}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Message Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddMessage()}
              className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              placeholder="e.g., Get exclusive early access"
            />
            <Button
              variant="secondary"
              onClick={handleAddMessage}
              disabled={!newMessage.trim()}
              size="sm"
            >
              Add
            </Button>
          </div>
          
          {editedWaitlistMessages.length === 0 && (
            <p className="mt-2 text-sm text-gray-400 italic">
              No messages added. A default message will be shown.
            </p>
          )}
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
                  checked={editedAutoApprove}
                  onChange={(e) => setEditedAutoApprove(e.target.checked)}
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
                  value={editedInvitationQuota}
                  onChange={(e) => setEditedInvitationQuota(parseInt(e.target.value) || 0)}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Invitation Send Time
                </label>
                <input
                  type="time"
                  value={editedInvitationTime}
                  onChange={(e) => setEditedInvitationTime(e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t">
          <Button
            variant="primary"
            onClick={handleSave}
            loading={isSaving}
            icon={<Save size={18} />}
          >
            Save Branding
          </Button>
        </div>
      </div>
    </ContentCard>
  );
}

