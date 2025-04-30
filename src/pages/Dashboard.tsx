// src/pages/Dashboard.tsx
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createSpotifyApi } from '../services/spotify';
import { createAppleMusicApi } from '../services/apple-music';

interface Playlist {
  id: string;
  name: string;
  description: string;
  trackCount: number;
  source: 'spotify' | 'appleMusic';
}

const Dashboard = () => {
  const { spotifyToken, appleMusicToken, isSpotifyAuthenticated, isAppleMusicAuthenticated, logout } = useContext(AuthContext);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<Playlist[]>([]);
  const [appleMusicPlaylists, setAppleMusicPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not authenticated with both services
    if (!isSpotifyAuthenticated || !isAppleMusicAuthenticated) {
      navigate('/');
      return;
    }

    const fetchPlaylists = async () => {
      try {
        setLoading(true);

        // Fetch Spotify playlists
        if (spotifyToken) {
          const spotifyApi = createSpotifyApi(spotifyToken);
          const spotifyPlaylistsData = await spotifyApi.getUserPlaylists();
          const formattedSpotifyPlaylists = spotifyPlaylistsData.map((playlist: any) => ({
            id: playlist.id,
            name: playlist.name,
            description: playlist.description || '',
            trackCount: playlist.tracks.total,
            source: 'spotify' as const
          }));
          setSpotifyPlaylists(formattedSpotifyPlaylists);
        }

        // Fetch Apple Music playlists
        if (appleMusicToken) {
          const appleMusicApi = createAppleMusicApi(appleMusicToken);
          const appleMusicPlaylistsData = await appleMusicApi.getUserPlaylists();
          const formattedAppleMusicPlaylists = appleMusicPlaylistsData.map((playlist: any) => ({
            id: playlist.id,
            name: playlist.attributes.name,
            description: playlist.attributes.description?.standard || '',
            trackCount: playlist.attributes.trackCount,
            source: 'appleMusic' as const
          }));
          setAppleMusicPlaylists(formattedAppleMusicPlaylists);
        }
      } catch (error) {
        console.error('Error fetching playlists:', error);
        setError('Failed to fetch playlists. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [spotifyToken, appleMusicToken, isSpotifyAuthenticated, isAppleMusicAuthenticated, navigate]);

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
  };

  const handleSync = () => {
    if (selectedPlaylist) {
      // Navigate to sync page with selected playlist info
      navigate('/sync-playlist', { 
        state: { 
          playlist: selectedPlaylist
        } 
      });
    }
  };

  const handleSharePlaylist = (playlist: Playlist) => {
    let shareUrl = '';
    
    if (playlist.source === 'spotify' && spotifyToken) {
      const spotifyApi = createSpotifyApi(spotifyToken);
      shareUrl = spotifyApi.getPlaylistShareUrl(playlist.id);
    } else if (playlist.source === 'appleMusic' && appleMusicToken) {
      const appleMusicApi = createAppleMusicApi(appleMusicToken);
      shareUrl = appleMusicApi.getPlaylistShareUrl(playlist.id);
    }
    
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    }
  };

  if (loading) {
    return <div>Loading your playlists...</div>;
  }

  if (error) {
    return (
      <div>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1>Your Playlists</h1>
      
      <div className="playlists-grid">
        <div className="playlist-column">
          <h2>Spotify Playlists</h2>
          {spotifyPlaylists.length === 0 ? (
            <p>No Spotify playlists found.</p>
          ) : (
            <ul className="playlist-list">
              {spotifyPlaylists.map(playlist => (
                <li 
                  key={`spotify-${playlist.id}`}
                  className={selectedPlaylist?.id === playlist.id ? 'selected' : ''}
                  onClick={() => handlePlaylistSelect(playlist)}
                >
                  <div className="playlist-info">
                    <h3>{playlist.name}</h3>
                    <p>{playlist.trackCount} tracks</p>
                  </div>
                  <div className="playlist-actions">
                    <button onClick={(e) => {
                      e.stopPropagation();
                      handleSharePlaylist(playlist);
                    }}>
                      Share
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="playlist-column">
          <h2>Apple Music Playlists</h2>
          {appleMusicPlaylists.length === 0 ? (
            <p>No Apple Music playlists found.</p>
          ) : (
            <ul className="playlist-list">
              {appleMusicPlaylists.map(playlist => (
                <li 
                  key={`apple-${playlist.id}`}
                  className={selectedPlaylist?.id === playlist.id ? 'selected' : ''}
                  onClick={() => handlePlaylistSelect(playlist)}
                >
                  <div className="playlist-info">
                    <h3>{playlist.name}</h3>
                    <p>{playlist.trackCount} tracks</p>
                  </div>
                  <div className="playlist-actions">
                    <button onClick={(e) => {
                      e.stopPropagation();
                      handleSharePlaylist(playlist);
                    }}>
                      Share
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {selectedPlaylist && (
        <div className="selected-playlist-actions">
          <h3>Selected: {selectedPlaylist.name}</h3>
          <button onClick={handleSync} className="sync-button">
            Sync to {selectedPlaylist.source === 'spotify' ? 'Apple Music' : 'Spotify'}
          </button>
        </div>
      )}
      
      <div className="account-actions">
        <button onClick={logout} className="logout-button">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;