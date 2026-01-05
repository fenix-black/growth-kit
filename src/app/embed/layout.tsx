import React from 'react';
import { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'GrowthKit Widget',
  description: 'GrowthKit embedded widget',
  // Prevent indexing of embed pages
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Minimal layout for embedded widgets
 * - No navigation, no header, no footer
 * - Transparent background by default
 * - Designed to be displayed in iframes
 */
export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Embed-specific styles */}
      <style>{`
        body {
          background: transparent !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          min-height: auto !important;
        }
      `}</style>
      
      {/* Main content */}
      {children}
      
      {/* Script to communicate height changes to parent iframe */}
      <Script id="growthkit-embed-resize" strategy="afterInteractive">
        {`
          // Auto-resize iframe and communicate with parent
          (function() {
            function sendHeight() {
              const height = document.documentElement.scrollHeight || document.body.scrollHeight;
              window.parent.postMessage({ type: 'growthkit:resize', height: height }, '*');
            }
            
            // Send initial height
            sendHeight();
            
            // Watch for DOM changes
            const observer = new MutationObserver(sendHeight);
            observer.observe(document.body, { 
              childList: true, 
              subtree: true, 
              attributes: true,
              characterData: true 
            });
            
            // Also send on resize
            window.addEventListener('resize', sendHeight);
            
            // Send on load
            window.addEventListener('load', sendHeight);
            
            // Periodic check for first few seconds (catch late-loading content)
            let checks = 0;
            const interval = setInterval(() => {
              sendHeight();
              checks++;
              if (checks > 10) clearInterval(interval);
            }, 500);
          })();
        `}
      </Script>
    </>
  );
}

