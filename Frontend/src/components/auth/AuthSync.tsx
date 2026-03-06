import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthToken } from '../../lib/api-client';

/**
 * AuthSync component
 * Synchronizes Clerk authentication tokens with the API client.
 *
 * It gates rendering of protected app content until the first token sync
 * attempt completes, preventing repeated unauthorized requests during login.
 */
export const AuthSync: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    const syncToken = async () => {
      if (!isLoaded) return;

      try {
        const token = await getToken();
        setAuthToken(token ?? null);

        if (isSignedIn && !token) {
          console.warn('[Auth] Signed in but no token is available yet');
        }
      } catch (error) {
        console.error('[Auth] Failed to get token:', error);
        setAuthToken(null);
      } finally {
        setTokenReady(true);
      }
    };

    setTokenReady(false);
    syncToken();

    const interval = setInterval(syncToken, 60000);
    return () => clearInterval(interval);
  }, [getToken, isLoaded, isSignedIn]);

  if (!isLoaded || (isSignedIn && !tokenReady)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Preparing secure session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
