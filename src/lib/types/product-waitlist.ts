/**
 * Product Waitlist Types
 * 
 * Defines types for product-specific waitlists that can be embedded
 * anywhere in a web application.
 */

/**
 * Custom field configuration for product waitlists
 * (Phase 2 - Custom Fields)
 */
export interface ProductCustomField {
  id: string;
  type: 'smart-name' | 'smart-email' | 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'url' | 'phone' | 'date';
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
  updateFingerprint?: boolean;  // For smart fields
  showIfEmpty?: boolean;         // For smart fields
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
    step?: number;
  };
  order: number;
}

/**
 * Product waitlist configuration stored in App.metadata
 */
export interface ProductWaitlistConfig {
  tag: string;                    // URL-safe identifier (e.g., "premium-plan")
  name: string;                   // Display name (e.g., "Premium Plan")
  description?: string;           // Widget description
  successMessage?: string;        // Custom success message
  enabled: boolean;               // Active/inactive toggle
  
  // Auto-invite settings
  autoInviteEnabled: boolean;
  dailyInviteQuota: number;
  inviteTime: string;             // "HH:MM" format
  
  // Email configuration
  inviteEmailTemplate?: string;   // References email template ID
  
  // Branding overrides (null = inherit from app)
  primaryColor?: string | null;
  logoUrl?: string | null;
  
  // Custom fields (Phase 2)
  customFields?: ProductCustomField[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * App metadata structure
 */
export interface AppMetadata {
  productWaitlists?: ProductWaitlistConfig[];
  // Other metadata can be added here in the future
}

/**
 * Product waitlist entry status
 */
export type ProductWaitlistStatus = 'WAITING' | 'INVITED' | 'ACCEPTED';

/**
 * Custom field responses (stored in Waitlist.metadata)
 */
export interface ProductWaitlistMetadata {
  customFields?: Record<string, any>;
  productName?: string;          // Cached product name for reference
  submittedAt?: string;
}

/**
 * Public API response for product list
 */
export interface PublicProductResponse {
  tag: string;
  name: string;
  description?: string;
  primaryColor?: string;
  logoUrl?: string;
  enabled: boolean;
}

/**
 * Product waitlist user status (returned in /api/public/user)
 */
export interface ProductWaitlistUserStatus {
  isOnList: boolean;
  status: ProductWaitlistStatus;
  joinedAt: string;
}

/**
 * Admin analytics response for a product
 */
export interface ProductAnalytics {
  total: number;
  byStatus: {
    WAITING: number;
    INVITED: number;
    ACCEPTED: number;
  };
  timeline: Record<string, number>;  // Date -> count
  conversionRate: number;            // invited → accepted
}

/**
 * Helper to validate product tag format
 */
export function isValidProductTag(tag: string): boolean {
  return /^[a-z0-9-]+$/.test(tag);
}

/**
 * Helper to generate tag from name
 */
export function generateProductTag(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

/**
 * Helper to validate product config
 */
export function validateProductConfig(config: Partial<ProductWaitlistConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.tag) {
    errors.push('Tag is required');
  } else if (!isValidProductTag(config.tag)) {
    errors.push('Tag must contain only lowercase letters, numbers, and hyphens');
  }
  
  if (!config.name || config.name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  if (config.dailyInviteQuota !== undefined && config.dailyInviteQuota < 0) {
    errors.push('Daily invite quota must be positive');
  }
  
  if (config.inviteTime && !/^\d{2}:\d{2}$/.test(config.inviteTime)) {
    errors.push('Invite time must be in HH:MM format');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Helper to get products from app metadata
 */
export function getProductWaitlists(metadata: any): ProductWaitlistConfig[] {
  if (!metadata || typeof metadata !== 'object') {
    return [];
  }
  
  return (metadata as AppMetadata).productWaitlists || [];
}

/**
 * Helper to find product by tag
 */
export function findProductByTag(metadata: any, tag: string): ProductWaitlistConfig | null {
  const products = getProductWaitlists(metadata);
  return products.find(p => p.tag === tag) || null;
}

/**
 * Helper to check if product tag exists in app
 */
export function productTagExists(metadata: any, tag: string, excludeTag?: string): boolean {
  const products = getProductWaitlists(metadata);
  return products.some(p => p.tag === tag && p.tag !== excludeTag);
}

