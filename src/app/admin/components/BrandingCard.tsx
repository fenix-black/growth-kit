'use client';

import { useState } from 'react';
import ContentCard from '@/components/ui/ContentCard';
import Button from '@/components/ui/Button';
import { Upload, X, Save, Image as ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface BrandingCardProps {
  appId: string;
  description?: string;
  logoUrl?: string;
  primaryColor?: string;
  backgroundColor?: string;
  cardBackgroundColor?: string;
  waitlistLayout?: string;
  waitlistMessages?: string[];
  waitlistTargetSelector?: string;
  hideGrowthKitBranding?: boolean;
  onUpdate: () => void;
}

export default function BrandingCard({
  appId,
  description,
  logoUrl,
  primaryColor,
  backgroundColor,
  cardBackgroundColor,
  waitlistLayout,
  waitlistMessages,
  waitlistTargetSelector,
  hideGrowthKitBranding,
  onUpdate,
}: BrandingCardProps) {
  const [editedDescription, setEditedDescription] = useState(description || '');
  const [editedLogoUrl, setEditedLogoUrl] = useState(logoUrl || '');
  const [editedPrimaryColor, setEditedPrimaryColor] = useState(primaryColor || '#10b981');
  
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
          description: editedDescription,
          logoUrl: editedLogoUrl || null,
          primaryColor: editedPrimaryColor,
          backgroundColor: generateBackgroundColor(),
          cardBackgroundColor: generateCardColor(),
          waitlistLayout: editedWaitlistLayout,
          waitlistMessages: editedWaitlistMessages,
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
    <ContentCard title="Branding & Waitlist Display" className="mt-6">
      <div className="space-y-6 p-6">
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            App Description
          </label>
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Brief description of your app (shown on waitlist screen)"
          />
        </div>

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
                {isUploading ? 'Uploading...' : 'Upload Logo'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
              <p className="mt-2 text-sm text-gray-500">
                PNG, JPG, or WebP. Max 5MB. Will be optimized to 512x512px.
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

        {/* Color Presets */}
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
            
            {/* Background Preview */}
            <div className="mt-3 p-4 rounded-lg border border-gray-200" style={{ background: generateBackgroundColor() }}>
              <p className="text-center text-sm text-white font-medium drop-shadow">Preview</p>
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
            
            {/* Card Preview */}
            <div className="mt-3 p-8 rounded-lg" style={{ background: generateBackgroundColor() }}>
              <div className="p-4 rounded-lg shadow-lg" style={{ background: generateCardColor(), backdropFilter: cardOpacity < 100 ? 'blur(10px)' : 'none' }}>
                <p className="text-center text-sm text-white font-medium">Card Preview</p>
              </div>
            </div>
          </div>
        </div>

        {/* Waitlist Layout */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Waitlist Layout
          </label>
          <select
            value={editedWaitlistLayout}
            onChange={(e) => setEditedWaitlistLayout(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="centered">Centered (Default)</option>
            <option value="split">Split Layout</option>
            <option value="minimal">Minimal</option>
            <option value="embed">Embed (Widget Mode)</option>
          </select>
          <p className="mt-2 text-sm text-gray-500">
            {editedWaitlistLayout === 'embed' 
              ? 'Widget will auto-inject into the specified CSS selector on your page'
              : 'Choose how the waitlist screen will be displayed'
            }
          </p>
        </div>

        {/* Target Selector (only for embed mode) */}
        {editedWaitlistLayout === 'embed' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target CSS Selector
            </label>
            <input
              type="text"
              value={editedTargetSelector}
              onChange={(e) => setEditedTargetSelector(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
              placeholder="#waitlist-container or .hero-section"
            />
            <p className="mt-2 text-sm text-gray-500">
              The SDK will automatically find this element and inject the waitlist widget there.
              Examples: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">#hero</code>, <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">.waitlist</code>, <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">#main-content</code>
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

