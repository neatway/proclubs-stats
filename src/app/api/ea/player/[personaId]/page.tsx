"use client";
import { use, useEffect, useState } from "react";
import { safeRender } from "@/lib/ea-type-guards";

interface PlayerPageProps {
  params: Promise<{ personaId: string }>;
  searchParams?: Promise<{ platform?: string }>;
}

export default function PlayerPage({ params, searchParams }: PlayerPageProps) {
  const { personaId } = use(params);
  const resolvedSearchParams = searchParams ? use(searchParams) : {};
  const platform = resolvedSearchParams?.platform || "common-gen5";

  const [data, setData] = useState<Record<string, unknown> | null>(null);
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
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed";
        setError(message);
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
            <p className="text-xs text-gray-500">Source: {safeRender(data.via)}</p>
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
