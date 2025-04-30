// src/App.tsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { createSpotifyApi, getSpotifyAuthUrl } from './services/spotify';
import { createAppleMusicApi, initAppleMusicKit } from './services/apple-music';

// Pages
import Home from './pages/Home';
import SpotifyCallback from './pages/SpotifyCallback';
import Dashboard from './pages/Dashboard';
import PlaylistSync from './pages/PlaylistSync';

// Auth context
import { AuthProvider } from './context/AuthContext';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAppleMusicInitialized, setIsAppleMusicInitialized] = useState(false);

  useEffect(() => {
    // Initialize Apple Music
    const initializeAppleMusic = async () => {
      try {
        await initAppleMusicKit();
        setIsAppleMusicInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Apple Music:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Load Apple Music JS SDK
    const script = document.createElement('script');
    script.src = 'https://js-cdn.music.apple.com/musickit/v1/musickit.js';
    script.async = true;
    script.onload = () => {
      initializeAppleMusic();
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <header>
            <nav>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/dashboard">Dashboard</Link></li>
              </ul>
            </nav>
          </header>
          <main>
            <Routes>
              <Route path="/" element={<Home appleMusicReady={isAppleMusicInitialized} />} />
              <Route path="/callback/spotify" element={<SpotifyCallback />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/sync-playlist" element={<PlaylistSync />} />
            </Routes>
          </main>
          <footer>
            <p>Playlist Sync - Sync your Apple Music and Spotify playlists</p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;