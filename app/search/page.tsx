// app/search/page.tsx
import SaavnSearch from "@/components/SaavnSearch"

export default function SearchPage() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">🔍 Search JioSaavn Songs</h1>
      <SaavnSearch />
    </div>
  )
}
