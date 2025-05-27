// /lib/saavnApi.ts

export async function searchSongs(query: string) {
  const res = await fetch(`https://saavn.dev/api/songs/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) {
    throw new Error("Failed to fetch songs");
  }
  const data = await res.json();
  return data;
}

export async function getTrendingSongs() {
  const res = await fetch("https://saavn.dev/api/songs/trending/india");
  if (!res.ok) {
    throw new Error("Failed to fetch trending songs");
  }
  const data = await res.json();
  return data;
}
