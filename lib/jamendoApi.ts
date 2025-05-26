const JAMENDO_CLIENT_ID = 'df187b27';
const JAMENDO_BASE_URL = 'https://api.jamendo.com/v3.0';

export interface JamendoTrack {
  id: string;
  name: string;
  duration: number;
  artist_name: string;
  album_name: string;
  image: string;
  audio: string;
}

export async function searchTracks(query: string): Promise<JamendoTrack[]> {
  const response = await fetch(
    `${JAMENDO_BASE_URL}/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=jsonpretty&limit=20&search=${query}`
  );
  const data = await response.json();
  return data.results;
}

export async function getPopularTracks(): Promise<JamendoTrack[]> {
  const response = await fetch(
    `${JAMENDO_BASE_URL}/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=jsonpretty&limit=20&order=popularity_total`
  );
  const data = await response.json();
  return data.results;
}
