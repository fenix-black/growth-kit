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
  waitlistLayout?: string;
  waitlistMessages?: string[];
  hideGrowthKitBranding?: boolean;
  onUpdate: () => void;
}

export default function BrandingCard({
  appId,
  description,
  logoUrl,
  primaryColor,
  waitlistLayout,
  waitlistMessages,
  hideGrowthKitBranding,
  onUpdate,
}: BrandingCardProps) {
  const [editedDescription, setEditedDescription] = useState(description || '');
  const [editedLogoUrl, setEditedLogoUrl] = useState(logoUrl || '');
  const [editedPrimaryColor, setEditedPrimaryColor] = useState(primaryColor || '#10b981');
  const [editedWaitlistLayout, setEditedWaitlistLayout] = useState(waitlistLayout || 'centered');
  const [editedWaitlistMessages, setEditedWaitlistMessages] = useState<string[]>(waitlistMessages || []);
  const [newMessage, setNewMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
          waitlistLayout: editedWaitlistLayout,
          waitlistMessages: editedWaitlistMessages,
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

        {/* Primary Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand Color
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={editedPrimaryColor}
              onChange={(e) => setEditedPrimaryColor(e.target.value)}
              className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={editedPrimaryColor}
              onChange={(e) => setEditedPrimaryColor(e.target.value)}
              className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="#10b981"
            />
            <div
              className="h-10 w-10 rounded-lg border border-gray-300"
              style={{ backgroundColor: editedPrimaryColor }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Used for buttons and accents in the waitlist screen
          </p>
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
          </select>
          <p className="mt-2 text-sm text-gray-500">
            Choose how the waitlist screen will be displayed
          </p>
        </div>

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

