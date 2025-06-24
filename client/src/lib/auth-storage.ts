// Persistent auth storage for faster authentication
export class AuthStorage {
  private static readonly AUTH_KEY = 'mentorme_auth';
  private static readonly SESSION_KEY = 'mentorme_session';

  static setAuthData(userData: any) {
    try {
      const authData = {
        user: userData,
        timestamp: Date.now(),
        sessionId: Math.random().toString(36).substring(7)
      };
      localStorage.setItem(this.AUTH_KEY, JSON.stringify(authData));
      sessionStorage.setItem(this.SESSION_KEY, 'active');
    } catch (error) {
      console.warn('Failed to store auth data:', error);
    }
  }

  static getAuthData() {
    try {
      const authDataStr = localStorage.getItem(this.AUTH_KEY);
      const sessionActive = sessionStorage.getItem(this.SESSION_KEY);
      
      if (!authDataStr || !sessionActive) return null;
      
      const authData = JSON.parse(authDataStr);
      
      // Check if auth data is less than 1 hour old
      const isRecent = (Date.now() - authData.timestamp) < (60 * 60 * 1000);
      
      return isRecent ? authData.user : null;
    } catch (error) {
      console.warn('Failed to retrieve auth data:', error);
      return null;
    }
  }

  static clearAuthData() {
    try {
      localStorage.removeItem(this.AUTH_KEY);
      sessionStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      console.warn('Failed to clear auth data:', error);
    }
  }

  static isAuthenticated() {
    const authData = this.getAuthData();
    return !!authData;
  }
}