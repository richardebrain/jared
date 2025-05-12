import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Google Sign In - try both redirect and popup methods
export const signInWithGoogle = async () => {
  try {
    // First, check if we're coming back from a redirect
    const redirectResult = await getRedirectResult(auth);
    
    if (redirectResult && redirectResult.user) {
      // We just came back from a redirect sign-in
      return {
        success: true,
        user: redirectResult.user,
        credential: GoogleAuthProvider.credentialFromResult(redirectResult)
      };
    }
    
    // If we're on mobile or have popup issues, use redirect
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
        window.innerWidth < 768) {
      // Use redirect for mobile
      await signInWithRedirect(auth, googleProvider);
      // This will redirect the page, so we don't return anything here
      return { success: false, redirecting: true };
    } else {
      // Try popup for desktop
      try {
        const result = await signInWithPopup(auth, googleProvider);
        return {
          success: true,
          user: result.user,
          credential: GoogleAuthProvider.credentialFromResult(result)
        };
      } catch (popupError) {
        console.error("Popup failed, trying redirect", popupError);
        // Fallback to redirect if popup fails
        await signInWithRedirect(auth, googleProvider);
        return { success: false, redirecting: true };
      }
    }
  } catch (error) {
    console.error("Google auth error:", error);
    return {
      success: false,
      error
    };
  }
};

// Sign Out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

export { auth };