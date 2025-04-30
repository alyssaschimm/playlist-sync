// src/context/AuthContext.tsx
import { createContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  spotifyToken: string | null;
  spotifyRefreshToken: string | null;
  appleMusicToken: string | null;
  isSpotifyAuthenticated: boolean;
  isAppleMusicAuthenticated: boolean;
  setSpotifyTokens: (accessToken: string, refreshToken: string) => void;
  setAppleMusicToken: (token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  spotifyToken: null,
  spotifyRefreshToken: null,
  appleMusicToken: null,
  isSpotifyAuthenticated: false,
  isAppleMusicAuthenticated: false,
  setSpotifyTokens: () => {},
  setAppleMusicToken: () => {},
  logout: () => {}
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [spotifyToken, setSpotifyToken] = useState<string | null>(localStorage.getItem('spotify_access_token'));
  const [spotifyRefreshToken, setSpotifyRefreshToken] = useState<string | null>(localStorage.getItem('spotify_refresh_token'));
  const [appleMusicToken, setAppleMusicToken] = useState<string | null>(localStorage.getItem('apple_music_token'));

  const isSpotifyAuthenticated = !!spotifyToken;
  const isAppleMusicAuthenticated = !!appleMusicToken;

  useEffect(() => {
    // Check if tokens are still valid on app load
    // You might want to implement token refresh logic here
  }, []);

  const setSpotifyTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('spotify_access_token', accessToken);
    localStorage.setItem('spotify_refresh_token', refreshToken);
    setSpotifyToken(accessToken);
    setSpotifyRefreshToken(refreshToken);
  };

  const updateAppleMusicToken = (token: string) => {
    localStorage.setItem('apple_music_token', token);
    setAppleMusicToken(token);
  };

  const logout = () => {
    // Clear all tokens
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('apple_music_token');
    setSpotifyToken(null);
    setSpotifyRefreshToken(null);
    setAppleMusicToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        spotifyToken,
        spotifyRefreshToken,
        appleMusicToken,
        isSpotifyAuthenticated,
        isAppleMusicAuthenticated,
        setSpotifyTokens,
        setAppleMusicToken: updateAppleMusicToken,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};