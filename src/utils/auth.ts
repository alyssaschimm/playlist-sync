// src/utils/auth.ts
// Function to refresh Spotify token when it expires
export const refreshSpotifyToken = async (refreshToken: string): Promise<string> => {
    const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
    const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID || '';
    const CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET || '';
  
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      });
  
      const response = await fetch(SPOTIFY_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
  
      const data = await response.json();
      
      if (data.access_token) {
        localStorage.setItem('spotify_access_token', data.access_token);
        return data.access_token;
      } else {
        throw new Error('No access token returned');
      }
    } catch (error) {
      console.error('Error refreshing Spotify token:', error);
      throw error;
    }
  };
  
  // src/utils/trackMatching.ts
  // Function to calculate similarity between two strings (for track matching)
  export const calculateStringSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Calculate Levenshtein distance
    const track = Array(s2.length + 1).fill(null).map(() => 
      Array(s1.length + 1).fill(null));
    
    for (let i = 0; i <= s1.length; i += 1) {
      track[0][i] = i;
    }
    
    for (let j = 0; j <= s2.length; j += 1) {
      track[j][0] = j;
    }
    
    for (let j = 1; j <= s2.length; j += 1) {
      for (let i = 1; i <= s1.length; i += 1) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    
    // Calculate similarity as 1 - normalized distance
    const maxLength = Math.max(s1.length, s2.length);
    if (maxLength === 0) return 1; // Both strings are empty
    return 1 - (track[s2.length][s1.length] / maxLength);
  };
  
  // Function to find best match from search results
  export const findBestMatch = (
    sourceTrack: { name: string; artist: string },
    searchResults: Array<{ name: string; artist: string; id: string }>
  ): string | null => {
    if (!searchResults.length) return null;
    
    const scores = searchResults.map(result => {
      // Calculate similarity for track name and artist separately
      const nameSimilarity = calculateStringSimilarity(sourceTrack.name, result.name);
      const artistSimilarity = calculateStringSimilarity(sourceTrack.artist, result.artist);
      
      // Weight name similarity more heavily
      return (nameSimilarity * 0.7) + (artistSimilarity * 0.3);
    });
    
    // Find index of highest score
    const bestMatchIndex = scores.indexOf(Math.max(...scores));
    
    // Only return a match if the score is above a threshold
    if (scores[bestMatchIndex] > 0.6) {
      return searchResults[bestMatchIndex].id;
    }
    
    return null;
  };