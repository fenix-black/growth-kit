'use client';

import { useState, useEffect } from 'react';

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

interface EmailTemplates {
  verification?: EmailTemplate;
  invitation?: EmailTemplate;
  waitlist_confirmation?: EmailTemplate;
}

interface EmailTemplateEditorProps {
  appId: string;
  appName: string;
  onClose?: () => void;
  embedded?: boolean;
}

export default function EmailTemplateEditor({ appId, appName, onClose, embedded = false }: EmailTemplateEditorProps) {
  const [activeTemplate, setActiveTemplate] = useState<keyof EmailTemplates>('invitation');
  const [templates, setTemplates] = useState<EmailTemplates>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewData, setPreviewData] = useState({
    appName: appName,
    userName: 'John Doe',
    userEmail: 'john@example.com',
    verificationLink: 'https://example.com/verify?token=abc123',
    invitationLink: 'https://example.com/invite?code=EARLYBIRD',
    referralCode: 'EARLYBIRD',
    credits: 10,
    position: 42,
  });

  useEffect(() => {
    fetchTemplates();
  }, [appId]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`/api/v1/admin/email-templates?appId=${appId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data.templates || {});
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/v1/admin/email-templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
        body: JSON.stringify({
          appId,
          templates,
        }),
      });

      if (response.ok) {
        alert('Email templates saved successfully!');
      } else {
        alert('Failed to save templates');
      }
    } catch (error) {
      console.error('Error saving templates:', error);
      alert('Failed to save templates');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all templates to defaults?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/admin/email-templates?appId=${appId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });

      if (response.ok) {
        alert('Templates reset to defaults');
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error resetting templates:', error);
    }
  };

  const updateTemplate = (field: keyof EmailTemplate, value: string) => {
    setTemplates(prev => ({
      ...prev,
      [activeTemplate]: {
        ...prev[activeTemplate],
        [field]: value,
      },
    }));
  };

  const getDefaultTemplate = (type: keyof EmailTemplates): EmailTemplate => {
    const defaults = {
      invitation: {
        subject: 'You\'re Invited to {{appName}}! 🎉',
        html: `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #333;">Welcome to {{appName}}!</h1>
  <p>Hi there!</p>
  <p>Great news! You've been selected from our waitlist to join {{appName}}.</p>
  <p>Use this special code to get started with {{credits}} free credits:</p>
  <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
    <code style="font-size: 24px; font-weight: bold; color: #007bff;">{{referralCode}}</code>
  </div>
  <p>Click the link below to accept your invitation:</p>
  <a href="{{invitationLink}}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
  <p style="color: #666; font-size: 14px; margin-top: 20px;">If you didn't request this invitation, you can safely ignore this email.</p>
</div>
        `.trim(),
      },
      verification: {
        subject: 'Verify Your Email for {{appName}}',
        html: `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #333;">Verify Your Email</h1>
  <p>Hi {{userName}},</p>
  <p>Please verify your email address to unlock {{credits}} free credits!</p>
  <a href="{{verificationLink}}" style="display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Verify Email</a>
  <p style="color: #666; font-size: 14px; margin-top: 20px;">This link expires in 24 hours.</p>
</div>
        `.trim(),
      },
      waitlist_confirmation: {
        subject: 'You\'re on the {{appName}} Waitlist!',
        html: `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #333;">You're on the List!</h1>
  <p>Thanks for joining the {{appName}} waitlist!</p>
  <p>You're currently <strong>#{{position}}</strong> in line.</p>
  <p>We'll email you as soon as your spot opens up.</p>
  <p style="color: #666; font-size: 14px; margin-top: 20px;">Want to skip the line? Share your referral link with friends!</p>
</div>
        `.trim(),
      },
    };

    return defaults[type] || defaults.invitation;
  };

  if (loading) {
    return <div className="text-center py-4">Loading templates...</div>;
  }

  const currentTemplate = templates[activeTemplate] || getDefaultTemplate(activeTemplate);

  const content = (
    <div className={embedded ? "" : "bg-white rounded-lg shadow-xl max-w-6xl w-full overflow-hidden"}>
        {!embedded && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Email Templates - {appName}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
          </div>
        )}
        <div className={embedded ? "border-b border-gray-200" : "px-6 py-4 border-b border-gray-200"}>
          <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTemplate('invitation')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTemplate === 'invitation'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Invitation
              </button>
              <button
                onClick={() => setActiveTemplate('verification')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTemplate === 'verification'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Email Verification
              </button>
              <button
                onClick={() => setActiveTemplate('waitlist_confirmation')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTemplate === 'waitlist_confirmation'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Waitlist Confirmation
              </button>
            </nav>
        </div>

        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="grid grid-cols-2 gap-6">
            {/* Editor */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={currentTemplate.subject}
                  onChange={(e) => updateTemplate('subject', e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Email subject..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HTML Template
                </label>
                <textarea
                  value={currentTemplate.html}
                  onChange={(e) => updateTemplate('html', e.target.value)}
                  rows={20}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
                  placeholder="HTML template..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Available variables: {'{{appName}}, {{userName}}, {{userEmail}}, {{credits}}, {{referralCode}}, {{invitationLink}}, {{verificationLink}}, {{position}}'}
                </p>
              </div>
            </div>

            {/* Preview */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="mb-2 pb-2 border-b border-gray-200">
                  <p className="text-xs text-gray-500">Subject:</p>
                  <p className="font-medium">
                    {currentTemplate.subject.replace(/\{\{(\w+)\}\}/g, (_, key) => 
                      String(previewData[key as keyof typeof previewData] || `{{${key}}}`)
                    )}
                  </p>
                </div>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: currentTemplate.html.replace(/\{\{(\w+)\}\}/g, (_, key) => 
                      String(previewData[key as keyof typeof previewData] || `{{${key}}}`)
                    )
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={handleReset}
            className="text-red-600 hover:text-red-700"
          >
            Reset to Defaults
          </button>
          <div className="space-x-4">
            <button
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Templates'}
            </button>
          </div>
        </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      {content}
    </div>
  );
}
