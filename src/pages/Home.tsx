// src/pages/Home.tsx
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getSpotifyAuthUrl } from '../services/spotify';
import { createAppleMusicApi } from '../services/apple-music';

interface HomeProps {
  appleMusicReady: boolean;
}

const Home = ({ appleMusicReady }: HomeProps) => {
  const { isSpotifyAuthenticated, isAppleMusicAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSpotifyLogin = () => {
    // Redirect to Spotify authorization page
    window.location.href = getSpotifyAuthUrl();
  };

  const handleAppleMusicLogin = async () => {
    try {
      if (!appleMusicReady) {
        alert('Apple Music is not initialized yet. Please try again later.');
        return;
      }
      
      const appleMusicApi = createAppleMusicApi();
      await appleMusicApi.authorize();
      
      // Refresh the page or update state to reflect authentication
      window.location.reload();
    } catch (error) {
      console.error('Error logging in with Apple Music:', error);
      alert('Failed to login with Apple Music');
    }
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="home-container">
      <h1>Playlist Sync</h1>
      <p>Sync your playlists between Apple Music and Spotify</p>
      
      <div className="auth-section">
        <h2>Connect Your Accounts</h2>
        
        <div className="auth-buttons">
          {!isSpotifyAuthenticated ? (
            <button onClick={handleSpotifyLogin} className="spotify-button">
              Connect to Spotify
            </button>
          ) : (
            <p>✅ Connected to Spotify</p>
          )}
          
          {!isAppleMusicAuthenticated ? (
            <button onClick={handleAppleMusicLogin} className="apple-music-button" disabled={!appleMusicReady}>
              Connect to Apple Music
            </button>
          ) : (
            <p>✅ Connected to Apple Music</p>
          )}
        </div>
        
        {isSpotifyAuthenticated && isAppleMusicAuthenticated && (
          <button onClick={goToDashboard} className="get-started-button">
            Go to Dashboard
          </button>
        )}
      </div>
      
      <div className="features-section">
        <h2>Features</h2>
        <ul>
          <li>Import playlists from Spotify to Apple Music</li>
          <li>Import playlists from Apple Music to Spotify</li>
          <li>Share your playlists with friends</li>
          <li>Keep your music library synchronized</li>
        </ul>
      </div>
    </div>
  );
};

export default Home;