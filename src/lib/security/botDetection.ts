/**
 * Bot Detection Utility
 * 
 * Simple bot detection to prevent bots from creating fingerprint records
 * and consuming credits. Uses isbot library for user-agent based detection.
 */

import { isbot } from 'isbot';

/**
 * Detect if a request is from a bot
 * 
 * @param userAgent The User-Agent header from the request
 * @returns true if bot detected, false otherwise
 */
export function detectBot(userAgent: string | null | undefined): boolean {
  // No user-agent is suspicious (could be bot or curl)
  if (!userAgent) {
    return true;
  }

  // Use isbot library for comprehensive bot detection
  return isbot(userAgent);
}

/**
 * Check if request is from a bot and should be blocked
 * This is the main function to use in API routes
 * 
 * @param userAgent The User-Agent header from the request
 * @returns true if request should be blocked, false if legitimate
 */
export function shouldBlockBot(userAgent: string | null | undefined): boolean {
  return detectBot(userAgent);
}
