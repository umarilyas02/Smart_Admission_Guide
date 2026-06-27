import { useEffect, useState } from 'react';

export function useAuthToken() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch('/api/auth/check');
        const data = await res.json();
        if (data.authenticated) {
          setToken('authenticated');
        }
      } catch {
        // If the endpoint fails, fall back to localStorage for backward compatibility
        try {
          const stored = localStorage.getItem('auth_token');
          if (stored) setToken(stored);
        } catch {
          // localStorage not available (incognito mode, etc.)
        }
      }
      setLoading(false);
    };

    fetchToken();
  }, []);

  return { token, loading };
}
