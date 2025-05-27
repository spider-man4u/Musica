'use client';

import { useEffect, useState } from 'react';
import { searchSongs, getTrendingSongs } from '@/lib/saavnApi';

export default function SearchPage() {
  const [songs, setSongs] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const data = await searchSongs(query);
      setSongs(data.data.results);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Load trending songs initially
    async function fetchTrending() {
      try {
        const data = await getTrendingSongs();
        setSongs(data.data);
      } catch (error) {
        console.error(error);
      }
    }

    fetchTrending();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Search Songs</h1>
      <div className="flex mb-6 gap-2">
        <input
          type="text"
          placeholder="Search for songs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button onClick={handleSearch} className="bg-blue-600 text-white px-4 py-2 rounded">
          Search
        </button>
      </div>

      {loading && <p>Loading...</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {songs.map((song: any) => (
          <div key={song.id} className="border rounded p-3 flex flex-col items-center text-center">
            <img src={song.image[2].link} alt={song.name} className="w-28 h-28 rounded mb-2" />
            <p className="font-semibold mb-1">{song.name}</p>
            <audio controls src={song.downloadUrl[4].link} className="w-full mt-2"></audio>
          </div>
        ))}
      </div>
    </div>
  );
}
