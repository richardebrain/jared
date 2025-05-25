/**
 * Emergency Fix Debug Helper
 * 
 * This file creates a small proxy to wrap the getUser method to help identify
 * where the "EMERGENCY FIX" message for Laura's account is coming from.
 */

import { storage } from './storage';
import { User } from '@shared/schema';

// Store the original getUser method
const originalGetUser = storage.getUser.bind(storage);

// Override the getUser method with our proxy
storage.getUser = async function(id: number): Promise<User | undefined> {
  // Call the original method
  const user = await originalGetUser(id);
  
  // Check if this is Laura's account (ID 5)
  if (user && user.id === 5) {
    console.log(`Laura's account accessed with ID: ${id}`);
    console.log(`Current points before any modifications: ${user.points}`);
    
    // Create a stack trace to see where this is being called from
    console.log('Stack trace for Laura access:');
    const stack = new Error().stack;
    console.log(stack);
  }
  
  return user;
};

export default storage;