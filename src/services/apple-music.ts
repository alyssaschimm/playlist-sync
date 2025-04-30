// src/services/apple-music.ts
import axios from 'axios';

const APPLE_MUSIC_API_BASE = 'https://api.music.apple.com/v1';

// These should come from environment variables
const DEVELOPER_TOKEN = process.env.REACT_APP_APPLE_DEVELOPER_TOKEN || '';
const MUSIC_USER_TOKEN = 'music-user-token'; // This will be stored in localStorage after authentication

// Initialize Apple Music Kit
export const initAppleMusicKit = async (
  developerToken: string = DEVELOPER_TOKEN,
  appName: string = 'Playlist Sync',
  appBuild: string = '1.0.0'
): Promise<any> => {
  // Ensure MusicKit JS is loaded
  if (!window.MusicKit) {
    throw new Error('MusicKit JS is not loaded');
  }

  try {
    return await window.MusicKit.configure({
      developerToken,
      app: {
        name: appName,
        build: appBuild
      }
    });
  } catch (error) {
    console.error('Error initializing Apple Music Kit:', error);
    throw error;
  }
};

// Create an authenticated Apple Music API instance
export const createAppleMusicApi = (musicUserToken: string = localStorage.getItem(MUSIC_USER_TOKEN) || '') => {
  const api = axios.create({
    baseURL: APPLE_MUSIC_API_BASE,
    headers: {
      'Authorization': `Bearer ${DEVELOPER_TOKEN}`,
      'Music-User-Token': musicUserToken,
      'Content-Type': 'application/json',
    },
  });
  
  return {
    // Authenticate user and get music user token
    authorize: async () => {
      try {
        const music = await initAppleMusicKit();
        const musicUserToken = await music.authorize();
        localStorage.setItem(MUSIC_USER_TOKEN, musicUserToken);
        return musicUserToken;
      } catch (error) {
        console.error('Error authorizing with Apple Music:', error);
        throw error;
      }
    },
    
    // Get user's playlists
    getUserPlaylists: async () => {
      try {
        const response = await api.get('/me/library/playlists');
        return response.data.data;
      } catch (error) {
        console.error('Error getting Apple Music playlists:', error);
        throw error;
      }
    },
    
    // Get tracks from a playlist
    getPlaylistTracks: async (playlistId: string) => {
      try {
        const response = await api.get(`/me/library/playlists/${playlistId}/tracks`);
        return response.data.data;
      } catch (error) {
        console.error('Error getting Apple Music playlist tracks:', error);
        throw error;
      }
    },
    
    // Create a new playlist
    createPlaylist: async (name: string, description: string = '', isPublic: boolean = true) => {
      try {
        const response = await api.post('/me/library/playlists', {
          attributes: {
            name,
            description
          }
        });
        return response.data.data[0];
      } catch (error) {
        console.error('Error creating Apple Music playlist:', error);
        throw error;
      }
    },
    
    // Add tracks to a playlist
    addTracksToPlaylist: async (playlistId: string, trackIds: string[]) => {
      try {
        const response = await api.post(`/me/library/playlists/${playlistId}/tracks`, {
          data: trackIds.map(id => ({
            id,
            type: 'songs'
          }))
        });
        return response.data;
      } catch (error) {
        console.error('Error adding tracks to Apple Music playlist:', error);
        throw error;
      }
    },
    
    // Search for tracks
    searchTracks: async (query: string) => {
      try {
        const response = await api.get(`/catalog/us/search?term=${encodeURIComponent(query)}&types=songs&limit=10`);
        return response.data.results.songs.data;
      } catch (error) {
        console.error('Error searching Apple Music tracks:', error);
        throw error;
      }
    },
    
    // Get playlist shareable URL
    getPlaylistShareUrl: (playlistId: string) => {
      return `https://music.apple.com/us/playlist/${playlistId}`;
    }
  };
};