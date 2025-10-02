'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useGrowthKitConfig } from './GrowthKitProvider';
import { useTranslation } from '../localization';

export interface ProductWaitlistWidgetProps {
  productTag: string;
  mode?: 'inline' | 'modal' | 'drawer';
  variant?: 'compact' | 'standard';
  trigger?: React.ReactNode;
  position?: 'left' | 'right';
  onSuccess?: (data: { isOnList: boolean }) => void;
  className?: string;
  style?: React.CSSProperties;
}

interface ProductConfig {
  tag: string;
  name: string;
  description?: string;
  successMessage?: string;
  primaryColor?: string;
  logoUrl?: string;
}

/**
 * Embeddable product waitlist widget
 * Supports inline, modal, and drawer modes
 */
export function ProductWaitlistWidget({
  productTag,
  mode = 'inline',
  variant = 'standard',
  trigger,
  position = 'right',
  onSuccess,
  className,
  style,
}: ProductWaitlistWidgetProps) {
  const { config, themeColors } = useGrowthKitConfig();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(mode === 'inline');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductConfig | null>(null);
  const [isOnList, setIsOnList] = useState(false);

  useEffect(() => {
    fetchProductConfig();
    checkUserStatus();
  }, [productTag]);

  useEffect(() => {
    // Handle ESC key for modal/drawer
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (mode === 'modal' || mode === 'drawer')) {
        setIsOpen(false);
      }
    };

    if (isOpen && mode !== 'inline') {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEsc);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, mode]);

  const fetchProductConfig = async () => {
    try {
      const response = await fetch(`${config.apiUrl || ''}/api/public/products/${productTag}`, {
        headers: {
          'X-Public-Token': `public_${config.publicKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProduct(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch product config:', err);
    }
  };

  const checkUserStatus = async () => {
    try {
      const response = await fetch(`${config.apiUrl || ''}/api/public/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Public-Token': `public_${config.publicKey}`,
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        const productStatus = data.data?.waitlist?.products?.[productTag];
        if (productStatus?.isOnList) {
          setIsOnList(true);
        }
      }
    } catch (err) {
      console.error('Failed to check user status:', err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError(t('waitlist.emailRequired'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('waitlist.invalidEmail'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${config.apiUrl || ''}/api/public/waitlist/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Public-Token': `public_${config.publicKey}`,
        },
        body: JSON.stringify({
          email,
          productTag,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsSuccess(true);
        setIsOnList(true);
        
        if (onSuccess) {
          onSuccess({ isOnList: true });
        }
      } else {
        const data = await response.json();
        setError(data.error || t('waitlist.joinFailed'));
      }
    } catch (err) {
      setError(t('waitlist.errorOccurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const brandColor = product?.primaryColor || themeColors.primary;

  // Render the form content
  const renderFormContent = () => {
    // Success state
    if (isSuccess || isOnList) {
      return (
        <div className="text-center">
          <div className="text-4xl mb-4">✓</div>
          <h3 className="text-lg font-bold mb-2" style={{ color: brandColor }}>
            {t('waitlist.youreOnTheList')}
          </h3>
          <p className="text-sm text-gray-600">
            {product?.successMessage || `We'll notify you when ${product?.name || 'this product'} is ready!`}
          </p>
        </div>
      );
    }

    // Compact variant
    if (variant === 'compact') {
      return (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            placeholder={t('waitlist.enterYourEmail')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-current focus:border-transparent"
            style={{ '--tw-ring-color': brandColor } as any}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90"
            style={{ backgroundColor: brandColor }}
          >
            {isSubmitting ? '...' : '→'}
          </button>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </form>
      );
    }

    // Standard variant
    return (
      <div>
        {product?.logoUrl && (
          <img
            src={product.logoUrl}
            alt={product.name}
            className="w-16 h-16 rounded-lg mb-4 object-contain"
          />
        )}
        <h3 className="text-xl font-bold mb-2" style={{ color: brandColor }}>
          {product?.name || 'Join Waitlist'}
        </h3>
        {product?.description && (
          <p className="text-sm text-gray-600 mb-4">{product.description}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder={t('waitlist.enterYourEmail')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-current focus:border-transparent"
            style={{ '--tw-ring-color': brandColor } as any}
          />
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-3 font-semibold text-white rounded-lg transition-all hover:opacity-90"
            style={{ backgroundColor: brandColor }}
          >
            {isSubmitting ? t('waitlist.joining') : t('waitlist.joinWaitlist')}
          </button>
          <p className="text-xs text-gray-500 text-center">
            {t('waitlist.noSpam')}
          </p>
        </form>
      </div>
    );
  };

  // Inline mode - render directly
  if (mode === 'inline') {
    return (
      <div className={className} style={style}>
        {renderFormContent()}
      </div>
    );
  }

  // Modal mode
  if (mode === 'modal') {
    return (
      <>
        {trigger && (
          <div onClick={() => setIsOpen(true)}>{trigger}</div>
        )}
        {isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
              {renderFormContent()}
            </div>
          </div>
        )}
      </>
    );
  }

  // Drawer mode
  return (
    <>
      {trigger && (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      )}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`fixed top-0 ${position === 'left' ? 'left-0' : 'right-0'} bottom-0 z-50 w-full max-w-md bg-white shadow-2xl transition-transform duration-300 overflow-y-auto`}
            style={{
              transform: isOpen ? 'translateX(0)' : `translateX(${position === 'left' ? '-100%' : '100%'})`,
            }}
          >
            <div className="p-6">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
              {renderFormContent()}
            </div>
          </div>
        </>
      )}
    </>
  );
}

