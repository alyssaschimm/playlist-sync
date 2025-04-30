// src/pages/SpotifyCallback.tsx
import { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSpotifyToken } from '../services/spotify';
import { AuthContext } from '../context/AuthContext';

const SpotifyCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { setSpotifyTokens } = useContext(AuthContext);

  useEffect(() => {
    const handleCallback = async () => {
      // Get authorization code from URL
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        setError(`Authentication error: ${error}`);
        setIsLoading(false);
        return;
      }

      if (!code) {
        setError('No authorization code found in the URL');
        setIsLoading(false);
        return;
      }

      try {
        // Exchange code for access token
        const tokenData = await getSpotifyToken(code);
        setSpotifyTokens(tokenData.access_token, tokenData.refresh_token);
        
        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Error exchanging code for token:', error);
        setError('Failed to authenticate with Spotify');
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [location, navigate, setSpotifyTokens]);

  if (isLoading) {
    return (
      <div className="spotify-callback-container">
        <h2>Authenticating with Spotify...</h2>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="spotify-callback-container error">
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Go Back Home</button>
      </div>
    );
  }

  return null;
};

export default SpotifyCallback;