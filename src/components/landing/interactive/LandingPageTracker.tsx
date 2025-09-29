'use client';

import { useGrowthKit } from '@fenixblack/growthkit';

// Higher-order component to add tracking to any clickable element
export function TrackableButton({ 
  children, 
  eventName, 
  eventData = {},
  className = '',
  onClick,
  ...props 
}: {
  children: React.ReactNode;
  eventName: string;
  eventData?: Record<string, any>;
  className?: string;
  onClick?: () => void;
  [key: string]: any;
}) {
  const { track } = useGrowthKit();

  const handleClick = () => {
    // Track the interaction
    track(eventName, {
      timestamp: Date.now(),
      ...eventData
    });
    
    // Call original onClick if provided
    if (onClick) {
      onClick();
    }
  };

  return (
    <button 
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

// Trackable Link component
export function TrackableLink({ 
  children, 
  eventName, 
  eventData = {},
  href,
  className = '',
  onClick,
  ...props 
}: {
  children: React.ReactNode;
  eventName: string;
  eventData?: Record<string, any>;
  href: string;
  className?: string;
  onClick?: () => void;
  [key: string]: any;
}) {
  const { track } = useGrowthKit();

  const handleClick = () => {
    // Track the interaction
    track(eventName, {
      timestamp: Date.now(),
      destination: href,
      ...eventData
    });
    
    // Call original onClick if provided
    if (onClick) {
      onClick();
    }
  };

  return (
    <a 
      href={href}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </a>
  );
}

// Section view tracker - triggers when section comes into view
export function SectionTracker({ 
  sectionId, 
  children 
}: { 
  sectionId: string; 
  children: React.ReactNode;
}) {
  const { track } = useGrowthKit();

  return (
    <div
      onMouseEnter={() => {
        track('section_viewed', {
          section: sectionId,
          timestamp: Date.now()
        });
      }}
    >
      {children}
    </div>
  );
}
