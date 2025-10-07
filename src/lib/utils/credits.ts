/**
 * Utility functions for credit display and formatting
 */

/**
 * Map internal credit reason codes to user-friendly display names
 * @param reason The internal credit reason code
 * @returns User-friendly display name
 */
export function formatCreditReason(reason: string): string {
  const reasonMap: Record<string, string> = {
    // Welcome/Initial Credits
    'invitation_grant': 'Welcome Bonus',
    'starting_grant': 'Welcome Bonus',
    
    // Regular Operations
    'daily_grant': 'Daily Credits',
    
    // Referrals
    'referral': 'Referral Bonus',
    'master_referral': 'Master Invite',
    
    // User Actions
    'name_claim': 'Name Added',
    'email_claim': 'Email Added',
    'email_verification': 'Email Verified',
    'email_verify': 'Email Verified',
    
    // Waitlist & Invitations
    'invitation_accepted': 'Invite Accepted',
    
    // Usage
    'consumed': 'Credit Used',
    'action': 'Action Completed',
    
    // Admin
    'manual': 'Manual Adjustment',
    'admin_grant': 'Admin Grant',
    'custom': 'Custom',
  };

  return reasonMap[reason] || formatFallbackReason(reason);
}

/**
 * Format unknown credit reasons in a readable way
 * @param reason The unknown reason
 * @returns Formatted version (e.g., "some_action" -> "Some Action")
 */
function formatFallbackReason(reason: string): string {
  return reason
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get color for credit reason (for charts and badges)
 * @param reason The credit reason
 * @returns Hex color code
 */
export function getCreditReasonColor(reason: string): string {
  const colorMap: Record<string, string> = {
    'invitation_grant': '#10b981',    // primary green (welcome)
    'starting_grant': '#10b981',      // primary green (welcome)
    'daily_grant': '#14b8a6',         // teal
    'referral': '#a855f7',            // purple
    'master_referral': '#d946ef',     // magenta
    'email_verification': '#f97316',  // orange
    'email_verify': '#f97316',        // orange
    'name_claim': '#06b6d4',          // cyan
    'email_claim': '#0ea5e9',         // sky
    'consumed': '#ef4444',            // red
    'action': '#8b5cf6',              // violet
    'custom': '#6366f1',              // indigo
  };
  
  return colorMap[reason] || '#8b5cf6'; // default violet
}

/**
 * Get emoji/icon for credit reason (optional, for enhanced display)
 * @param reason The credit reason
 * @returns Emoji character
 */
export function getCreditReasonEmoji(reason: string): string {
  const emojiMap: Record<string, string> = {
    'invitation_grant': '🎁',
    'starting_grant': '🎁',
    'daily_grant': '📅',
    'referral': '🤝',
    'master_referral': '👑',
    'email_verification': '✅',
    'email_verify': '✅',
    'name_claim': '👤',
    'email_claim': '📧',
    'consumed': '💸',
    'action': '⚡',
  };
  
  return emojiMap[reason] || '💳';
}
