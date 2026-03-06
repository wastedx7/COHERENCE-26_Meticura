import { useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to sync Clerk's session with app auth context
 * When user signs in via Clerk, this syncs the token to our app
 */
export const useClerkSync = () => {
  const { getToken, isLoaded, isSignedIn } = useClerkAuth();
  const { login, logout } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    const syncClerkSession = async () => {
      try {
        if (isSignedIn) {
          // Get Clerk session token and sync with app
          const token = await getToken();
          if (token) {
            await login(token);
          }
        } else {
          // User is signed out of Clerk
          logout();
        }
      } catch (error) {
        console.error('Failed to sync Clerk session:', error);
      }
    };

    syncClerkSession();
  }, [isLoaded, isSignedIn, getToken, login, logout]);
};
