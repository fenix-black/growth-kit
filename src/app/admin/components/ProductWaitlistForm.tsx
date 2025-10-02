'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import ContentCard from '@/components/ui/ContentCard';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { ProductWaitlistConfig, generateProductTag, validateProductConfig } from '@/lib/types/product-waitlist';

interface ProductWaitlistFormProps {
  appId: string;
  product: ProductWaitlistConfig | null;
  onCancel: () => void;
  onSave: () => void;
}

export default function ProductWaitlistForm({ appId, product, onCancel, onSave }: ProductWaitlistFormProps) {
  const [formData, setFormData] = useState<Partial<ProductWaitlistConfig>>({
    tag: '',
    name: '',
    description: '',
    successMessage: '',
    enabled: true,
    autoInviteEnabled: false,
    dailyInviteQuota: 5,
    inviteTime: '10:00',
    primaryColor: null,
    logoUrl: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagManuallyEdited, setTagManuallyEdited] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData(product);
      setTagManuallyEdited(true);
    }
  }, [product]);

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      // Auto-generate tag from name if not manually edited
      ...(!tagManuallyEdited && { tag: generateProductTag(name) }),
    }));
  };

  const handleTagChange = (tag: string) => {
    setTagManuallyEdited(true);
    setFormData(prev => ({ ...prev, tag }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    const validation = validateProductConfig(formData);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    setSaving(true);

    try {
      const url = product
        ? `/api/v1/admin/app/${appId}/products/${product.tag}`
        : `/api/v1/admin/app/${appId}/products`;
      
      const method = product ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSave();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save product');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          icon={<ArrowLeft size={16} />}
          onClick={onCancel}
        >
          Back
        </Button>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {product ? 'Edit Product Waitlist' : 'New Product Waitlist'}
          </h3>
          <p className="text-sm text-gray-600">
            {product ? `Editing: ${product.name}` : 'Create a new embeddable product waitlist'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Fields - Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <ContentCard>
              <h4 className="font-semibold text-gray-900 mb-4">Basic Info</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Premium Plan"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tag <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => handleTagChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                    placeholder="e.g., premium-plan"
                    pattern="[a-z0-9-]+"
                    required
                    disabled={!!product} // Can't change tag after creation
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {product 
                      ? '⚠️ Tag cannot be changed after creation (would break existing implementations)'
                      : 'URL-safe identifier (lowercase, numbers, hyphens only)'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    placeholder="Brief description shown in the widget"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Success Message
                  </label>
                  <textarea
                    value={formData.successMessage}
                    onChange={(e) => setFormData(prev => ({ ...prev, successMessage: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={2}
                    placeholder="Thanks! We'll notify you when this product is ready."
                  />
                </div>
              </div>
            </ContentCard>

            {/* Widget Settings */}
            <ContentCard>
              <h4 className="font-semibold text-gray-900 mb-4">Widget Settings</h4>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                    Active (users can join)
                  </label>
                </div>
              </div>
            </ContentCard>

            {/* Auto-Invite Settings */}
            <ContentCard>
              <h4 className="font-semibold text-gray-900 mb-4">Auto-Invite Settings</h4>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="autoInvite"
                    checked={formData.autoInviteEnabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, autoInviteEnabled: e.target.checked }))}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="autoInvite" className="text-sm font-medium text-gray-700">
                    Enable Auto-Invites
                  </label>
                </div>

                {formData.autoInviteEnabled && (
                  <div className="pl-7 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Daily Quota
                      </label>
                      <input
                        type="number"
                        value={formData.dailyInviteQuota}
                        onChange={(e) => setFormData(prev => ({ ...prev, dailyInviteQuota: parseInt(e.target.value) }))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        min="1"
                        max="1000"
                      />
                      <p className="text-xs text-gray-500 mt-1">Invites to send per day</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Send Time
                      </label>
                      <input
                        type="time"
                        value={formData.inviteTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, inviteTime: e.target.value }))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>
            </ContentCard>

            {/* Email Note */}
            <ContentCard>
              <h4 className="font-semibold text-gray-900 mb-4">Email Invitations</h4>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Product invitations</strong> use the global template configured in the{' '}
                  <strong>Email Templates</strong> tab. Variables like <code className="text-xs bg-white px-1 py-0.5 rounded">{'{{productName}}'}</code> will be automatically replaced with this product's information.
                </p>
              </div>
            </ContentCard>

            {/* Branding Overrides */}
            <ContentCard>
              <h4 className="font-semibold text-gray-900 mb-4">Branding Overrides</h4>
              <p className="text-sm text-gray-600 mb-4">
                Leave empty to inherit from app settings
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={formData.logoUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.primaryColor || '#10b981'}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value || null }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
                      placeholder="#10b981 (leave empty to inherit)"
                    />
                  </div>
                </div>
              </div>
            </ContentCard>
          </div>

          {/* Preview - Right Column (1/3) */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <ContentCard>
                <h4 className="font-semibold text-gray-900 mb-4">Preview</h4>
                
                {/* Widget Preview */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    {formData.logoUrl && (
                      <img 
                        src={formData.logoUrl} 
                        alt={formData.name || 'Logo'}
                        className="w-12 h-12 rounded-lg mb-3 object-contain"
                      />
                    )}
                    <h5 
                      className="font-bold text-lg mb-2"
                      style={{ color: formData.primaryColor || '#10b981' }}
                    >
                      {formData.name || 'Product Name'}
                    </h5>
                    {formData.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {formData.description}
                      </p>
                    )}
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-2"
                      disabled
                    />
                    <button
                      type="button"
                      className="w-full py-2 text-sm font-semibold text-white rounded-lg"
                      style={{ backgroundColor: formData.primaryColor || '#10b981' }}
                      disabled
                    >
                      Join Waitlist
                    </button>
                  </div>
                </div>

                {/* Implementation Code */}
                {formData.tag && (
                  <div className="mt-4">
                    <div className="text-xs font-medium text-gray-700 mb-2">Implementation:</div>
                    <div className="bg-gray-900 rounded p-3">
                      <code className="text-xs text-emerald-400 font-mono whitespace-pre-wrap break-all">
                        {`<WaitlistForm\n  productTag="${formData.tag}"\n  mode="inline"\n/>`}
                      </code>
                    </div>
                  </div>
                )}
              </ContentCard>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={<Save size={16} />}
            disabled={saving}
          >
            {saving ? 'Saving...' : (product ? 'Save Changes' : 'Create Product Waitlist')}
          </Button>
        </div>
      </form>
    </div>
  );
}

