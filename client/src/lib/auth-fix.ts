/**
 * Authentication bug fix
 * 
 * This file provides a temporary fix for the authentication loop issue
 * that occurs after login. It addresses the "Maximum update depth exceeded"
 * React error by preventing circular updates in authentication state.
 */

import { queryClient } from "../lib/queryClient";

/**
 * Fix authentication loop issues by stabilizing the auth state
 * Call this function on app initialization
 */
export function fixAuthenticationLoop() {
  // Create a safer way to prevent redundant auth updates
  const authUpdateCount: Record<string, number> = {};
  const MAX_UPDATES_PER_SECOND = 3;
  const DETECTION_WINDOW_MS = 1000;
  
  // Monkey patch the query cache's notify function
  const originalNotify = queryClient.getQueryCache().notify;
  
  queryClient.getQueryCache().notify = function(...args) {
    // Check if this is an authentication query update
    const event = args[0] as any;
    if (event?.query?.queryKey && 
        Array.isArray(event.query.queryKey) && 
        event.query.queryKey[0] === "/api/auth/me") {
      
      const now = Date.now();
      const key = now - (now % DETECTION_WINDOW_MS); // Current second timeframe
      
      // Increment the counter for this timeframe
      authUpdateCount[key] = (authUpdateCount[key] || 0) + 1;
      
      // If too many updates, log and break the cycle
      if (authUpdateCount[key] > MAX_UPDATES_PER_SECOND) {
        console.log(`Prevented auth update loop: ${authUpdateCount[key]} updates in < 1s`);
        
        // Clean up old counters
        Object.keys(authUpdateCount).forEach(timeKey => {
          if (Number(timeKey) < now - 5000) {
            delete authUpdateCount[timeKey];
          }
        });
        
        return; // Skip this update
      }
    }
    
    // Call original method for all other cases or valid auth updates
    return originalNotify.apply(queryClient.getQueryCache(), args);
  };
  
  // Add safeguard to prevent repeated redirects
  const originalReplace = window.location.replace;
  let lastRedirectTime = 0;
  let lastRedirectUrl = '';
  
  window.location.replace = function(url: string | URL) {
    const now = Date.now();
    const urlStr = url.toString();
    
    // If we're trying to redirect to the same URL within 2 seconds, block it
    if (urlStr === lastRedirectUrl && now - lastRedirectTime < 2000) {
      console.log('Prevented rapid redirect loop to', urlStr);
      return;
    }
    
    // Update tracking variables
    lastRedirectTime = now;
    lastRedirectUrl = urlStr;
    
    // Proceed with the redirect
    return originalReplace.call(window.location, url);
  };
  
  console.log('Authentication loop protection installed');
}