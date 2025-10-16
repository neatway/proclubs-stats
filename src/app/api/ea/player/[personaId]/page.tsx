"use client";
import { useEffect, useState } from "react";

export default function PlayerPage({ params, searchParams }: any) {
  const personaId = params.personaId;
  const platform = (searchParams?.platform as string) || "common-gen5";

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/ea/player?platform=${platform}&personaId=${encodeURIComponent(personaId)}`
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
        setData(json);
      } catch (e: any) {
        setError(e?.message || "Failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [personaId, platform]);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Player Profile</h1>
        <p className="text-sm text-gray-600">
          personaId: {personaId} — platform: {platform}
        </p>

        {loading && <div>Loading…</div>}
        {error && <div className="text-red-600">{error}</div>}

        {data && (
          <>
            <p className="text-xs text-gray-500">Source: {data.via}</p>
            <div className="bg-white p-4 rounded-2xl shadow">
              <h2 className="font-semibold text-lg mb-2">Career Stats (Raw)</h2>
              <pre className="text-sm overflow-auto">{JSON.stringify(data.data, null, 2)}</pre>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
