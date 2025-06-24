// Authentication validation and testing utilities
import { AuthStorage } from './auth-storage';

export class AuthValidator {
  static async validateAuthFlow(): Promise<boolean> {
    try {
      console.log('Validating authentication flow...');
      
      // Test 1: Check if auth storage is working
      const testUser = { id: 'test', username: 'test' };
      AuthStorage.setAuthData(testUser);
      const retrieved = AuthStorage.getAuthData();
      
      if (!retrieved || retrieved.id !== 'test') {
        console.error('Auth storage validation failed');
        return false;
      }
      
      AuthStorage.clearAuthData();
      console.log('✓ Auth storage working correctly');
      
      // Test 2: Check API connectivity
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        method: 'GET'
      });
      
      // 401 is expected for unauthenticated requests
      if (response.status === 401 || response.status === 200) {
        console.log('✓ Auth API accessible');
      } else {
        console.error('Auth API returned unexpected status:', response.status);
        return false;
      }
      
      // Test 3: Check login endpoint
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: 'test', password: 'test' })
      });
      
      // Should return 401 for invalid credentials
      if (loginResponse.status === 401) {
        console.log('✓ Login endpoint responding correctly');
      } else {
        console.warn('Login endpoint status:', loginResponse.status);
      }
      
      console.log('Authentication flow validation completed successfully');
      return true;
      
    } catch (error) {
      console.error('Auth validation failed:', error);
      return false;
    }
  }
  
  static isStorageAvailable(): boolean {
    try {
      const test = 'auth_test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  static getAuthStatus() {
    return {
      hasStoredAuth: !!AuthStorage.getAuthData(),
      storageAvailable: this.isStorageAvailable(),
      isAuthenticated: AuthStorage.isAuthenticated(),
      timestamp: new Date().toISOString()
    };
  }
}

// Auto-validate on load in development
if (process.env.NODE_ENV === 'development') {
  AuthValidator.validateAuthFlow().then(result => {
    console.log('Auth validation result:', result);
  });
}