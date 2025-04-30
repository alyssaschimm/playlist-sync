import axios from 'axios';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

// These should come from environment variables
const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID || '';
const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI || '';
const CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET || '';

// Scopes needed for the app
const SCOPES = [
  'playlist-read-private',
  'playlist-modify-private',
  'playlist-modify-public',
  'user-read-private',
  'user-read-email'
].join(' ');

// Generate the authorization URL
export const getSpotifyAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
  });
  
  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
};

// Exchange authorization code for access token
export const getSpotifyToken = async (code: string): Promise<any> => {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  try {
    const response = await axios.post(SPOTIFY_TOKEN_URL, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    throw error;
  }
};

// Create an authenticated Spotify API instance
export const createSpotifyApi = (accessToken: string) => {
  const api = axios.create({
    baseURL: SPOTIFY_API_BASE,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  return {
    // Get user's playlists
    getUserPlaylists: async () => {
      const response = await api.get('/me/playlists');
      return response.data.items;
    },
    
    // Get tracks from a playlist
    getPlaylistTracks: async (playlistId: string) => {
      const response = await api.get(`/playlists/${playlistId}/tracks`);
      return response.data.items.map((item: any) => item.track);
    },
    
    // Create a new playlist
    createPlaylist: async (userId: string, name: string, description: string = '', isPublic: boolean = true) => {
      const response = await api.post(`/users/${userId}/playlists`, {
        name,
        description,
        public: isPublic,
      });
      return response.data;
    },
    
    // Add tracks to a playlist
    addTracksToPlaylist: async (playlistId: string, trackUris: string[]) => {
      const response = await api.post(`/playlists/${playlistId}/tracks`, {
        uris: trackUris,
      });
      return response.data;
    },
    
    // Get the current user's profile
    getCurrentUser: async () => {
      const response = await api.get('/me');
      return response.data;
    },
    
    // Search for tracks
    searchTracks: async (query: string) => {
      const response = await api.get(`/search?q=${encodeURIComponent(query)}&type=track&limit=10`);
      return response.data.tracks.items;
    },
    
    // Get playlist shareable URL
    getPlaylistShareUrl: (playlistId: string) => {
      return `https://open.spotify.com/playlist/${playlistId}`;
    }
  };
};
