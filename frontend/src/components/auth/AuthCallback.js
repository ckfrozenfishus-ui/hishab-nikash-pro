import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { exchangeSession } from '../../lib/api';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        const hash = window.location.hash;
        const sessionId = new URLSearchParams(hash.substring(1)).get('session_id');
        if (!sessionId) {
          navigate('/login', { replace: true });
          return;
        }
        const res = await exchangeSession(sessionId);
        setUser(res.data);
        // Clean the hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/select-company', { replace: true, state: { user: res.data } });
      } catch (err) {
        console.error('Auth callback error:', err);
        navigate('/login', { replace: true });
      }
    };
    processAuth();
  }, [navigate, setUser]);

  return null;
}
