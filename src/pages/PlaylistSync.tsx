// src/pages/PlaylistSync.tsx
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createSpotifyApi } from '../services/spotify';
import { createAppleMusicApi } from '../services/apple-music';

interface Track {
  id: string;
  name: string;
  artist: string;
  matched?: boolean;
  targetId?: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  trackCount: number;
  source: 'spotify' | 'appleMusic';
}

const PlaylistSync = () => {
  const { spotifyToken, appleMusicToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation
  const [sourceTracks, setSourceTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncComplete, setSyncComplete] = useState(false);
  const [newPlaylistId, setNewPlaylistId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Extract the playlist information from the location state
  const playlist = location.state?.playlist as Playlist | undefined;
  const targetService = playlist?.source === 'spotify' ? 'appleMusic' : 'spotify';

  useEffect(() => {
    // Redirect if no playlist was selected
    if (!playlist) {
      navigate('/dashboard');
      return;
    }

    const fetchPlaylistTracks = async () => {
      try {
        setLoading(true);

        if (playlist.source === 'spotify' && spotifyToken) {
          const spotifyApi = createSpotifyApi(spotifyToken);
          const tracks = await spotifyApi.getPlaylistTracks(playlist.id);
          
          const formattedTracks = tracks.map((track: any) => ({
            id: track.id,
            name: track.name,
            artist: track.artists.map((artist: any) => artist.name).join(', '),
            matched: false
          }));
          
          setSourceTracks(formattedTracks);
        } else if (playlist.source === 'appleMusic' && appleMusicToken) {
          const appleMusicApi = createAppleMusicApi(appleMusicToken);
          const tracks = await appleMusicApi.getPlaylistTracks(playlist.id);
          
          const formattedTracks = tracks.map((track: any) => ({
            id: track.id,
            name: track.attributes.name,
            artist: track.attributes.artistName,
            matched: false
          }));
          
          setSourceTracks(formattedTracks);
        }
      } catch (error) {
        console.error('Error fetching playlist tracks:', error);
        setError('Failed to fetch playlist tracks');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistTracks();
  }, [playlist, spotifyToken, appleMusicToken, navigate]);

  const handleSync = async () => {
    if (!playlist || !sourceTracks.length) return;

    try {
      setSyncing(true);
      setSyncProgress(0);

      // Create new playlist in target service
      let newPlaylistId: string;
      let shareableUrl: string;

      if (targetService === 'spotify' && spotifyToken) {
        const spotifyApi = createSpotifyApi(spotifyToken);
        const user = await spotifyApi.getCurrentUser();
        const newPlaylist = await spotifyApi.createPlaylist(
          user.id,
          `${playlist.name} (from Apple Music)`,
          playlist.description || 'Synced from Apple Music'
        );
        newPlaylistId = newPlaylist.id;
        
        // Match tracks on Spotify
        const matchedTracks = [];
        for (let i = 0; i < sourceTracks.length; i++) {
          const track = sourceTracks[i];
          const searchQuery = `${track.name} ${track.artist}`;
          const searchResults = await spotifyApi.searchTracks(searchQuery);
          
          if (searchResults.length > 0) {
            matchedTracks.push(`spotify:track:${searchResults[0].id}`);
          }
          
          // Update progress
          setSyncProgress(Math.round(((i + 1) / sourceTracks.length) * 100));
        }
        
        // Add matched tracks to playlist
        if (matchedTracks.length > 0) {
          // Split into chunks of 100 (Spotify's limit)
          for (let i = 0; i < matchedTracks.length; i += 100) {
            const chunk = matchedTracks.slice(i, i + 100);
            await spotifyApi.addTracksToPlaylist(newPlaylistId, chunk);
          }
        }
        
        shareableUrl = spotifyApi.getPlaylistShareUrl(newPlaylistId);
      } else if (targetService === 'appleMusic' && appleMusicToken) {
        const appleMusicApi = createAppleMusicApi(appleMusicToken);
        const newPlaylist = await appleMusicApi.createPlaylist(
          `${playlist.name} (from Spotify)`,
          playlist.description || 'Synced from Spotify'
        );
        newPlaylistId = newPlaylist.id;
        
        // Match tracks on Apple Music
        const matchedTrackIds = [];
        for (let i = 0; i < sourceTracks.length; i++) {
          const track = sourceTracks[i];
          const searchQuery = `${track.name} ${track.artist}`;
          const searchResults = await appleMusicApi.searchTracks(searchQuery);
          
          if (searchResults.length > 0) {
            matchedTrackIds.push(searchResults[0].id);
          }
          
          // Update progress
          setSyncProgress(Math.round(((i + 1) / sourceTracks.length) * 100));
        }
        
        // Add matched tracks to playlist
        if (matchedTrackIds.length > 0) {
          await appleMusicApi.addTracksToPlaylist(newPlaylistId, matchedTrackIds);
        }
        
        shareableUrl = appleMusicApi.getPlaylistShareUrl(newPlaylistId);
      } else {
        throw new Error('Invalid target service or missing authentication');
      }
      
      // Update state with new playlist info
      setNewPlaylistId(newPlaylistId);
      setShareUrl(shareableUrl);
      setSyncComplete(true);
    } catch (error) {
      console.error('Error syncing playlist:', error);
      setError('Failed to sync playlist. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyShareLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    }
  };

  const handleReturnToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="playlist-sync-container">
        <h1>Loading playlist tracks...</h1>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="playlist-sync-container error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={handleReturnToDashboard}>Return to Dashboard</button>
      </div>
    );
  }

  if (syncComplete) {
    return (
      <div className="playlist-sync-container success">
        <h1>Playlist Sync Complete!</h1>
        <p>Successfully synced "{playlist?.name}" to {targetService === 'spotify' ? 'Spotify' : 'Apple Music'}.</p>
        <p>Matched {sourceTracks.length} tracks from your playlist.</p>
        
        <div className="share-section">
          <h2>Share Your Playlist</h2>
          <div className="share-link">
            <input type="text" value={shareUrl || ''} readOnly />
            <button onClick={handleCopyShareLink}>Copy Link</button>
          </div>
        </div>
        
        <button onClick={handleReturnToDashboard} className="return-button">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="playlist-sync-container">
      <h1>Sync Playlist</h1>
      <div className="playlist-details">
        <h2>{playlist?.name}</h2>
        <p>{playlist?.trackCount} tracks</p>
        <p>From: {playlist?.source === 'spotify' ? 'Spotify' : 'Apple Music'}</p>
        <p>To: {targetService === 'spotify' ? 'Spotify' : 'Apple Music'}</p>
      </div>
      
      {syncing ? (
        <div className="sync-progress">
          <h3>Syncing Playlist... {syncProgress}%</h3>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${syncProgress}%` }}></div>
          </div>
          <p>Please don't close this window while syncing is in progress</p>
        </div>
      ) : (
        <div className="tracks-preview">
          <h3>Tracks to Sync ({sourceTracks.length})</h3>
          <ul className="tracks-list">
            {sourceTracks.slice(0, 10).map(track => (
              <li key={track.id}>
                <span className="track-name">{track.name}</span>
                <span className="track-artist">by {track.artist}</span>
              </li>
            ))}
            {sourceTracks.length > 10 && (
              <li className="more-tracks">
                ...and {sourceTracks.length - 10} more tracks
              </li>
            )}
          </ul>
          
          <div className="sync-actions">
            <button onClick={handleSync} className="sync-button">
              Start Syncing
            </button>
            <button onClick={handleReturnToDashboard} className="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistSync;