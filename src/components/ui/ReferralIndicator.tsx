import { UserPlus } from 'lucide-react';
import { useState } from 'react';

interface ReferralIndicatorProps {
  referralSource: {
    referralId: string;
    referredAt: string | null;
    referrer: {
      id: string;
      fingerprintId: string;
      name: string | null;
      email: string | null;
    } | null;
  };
  className?: string;
}

export function ReferralIndicator({ referralSource, className = '' }: ReferralIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!referralSource?.referrer) {
    return null;
  }

  const { referrer, referredAt } = referralSource;
  
  // Format referrer display name
  const referrerDisplayName = 
    referrer.name || 
    referrer.email || 
    `fp_${referrer.fingerprintId.substring(0, 8)}`;

  // Format referred date
  const referredDateText = referredAt 
    ? new Date(referredAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    : 'Unknown date';

  const tooltipText = `Invited by ${referrerDisplayName} on ${referredDateText}`;

  return (
    <div className="relative inline-block">
      <div
        className={`inline-flex items-center ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <UserPlus 
          size={14} 
          className="text-blue-500 hover:text-blue-600 cursor-help"
        />
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-800 rounded-lg shadow-lg -top-2 left-6 whitespace-nowrap">
          <div className="font-medium">{tooltipText}</div>
          {referrer.email && referrer.name && (
            <div className="text-xs text-gray-300 mt-1">
              {referrer.email}
            </div>
          )}
          {/* Arrow */}
          <div className="absolute top-3 -left-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45" />
        </div>
      )}
    </div>
  );
}
