import { NextRequest, NextResponse } from "next/server";

const EA_BASE = "https://proclubs.ea.com/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") ?? "common-gen5";
  const personaId = searchParams.get("personaId");
  const clubId = searchParams.get("clubId");

  if (!personaId || !clubId) {
    return NextResponse.json(
      { error: "Missing personaId or clubId" },
      { status: 400 }
    );
  }

  // Get member stats for the specific club
  const url = `${EA_BASE}/fc/members/career/stats?platform=${encodeURIComponent(platform)}&clubId=${encodeURIComponent(clubId)}`;

  try {
    const res = await fetch(url, {
      headers: {
        accept: "application/json",
        origin: "https://www.ea.com",
        referer: "https://www.ea.com/",
        "user-agent": "Mozilla/5.0",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || res.statusText },
        { status: res.status }
      );
    }

    const text = await res.text();
    if (!text.trim()) {
      return NextResponse.json({ error: "Empty response from EA" }, { status: 502 });
    }

    const data = JSON.parse(text);

    // Find the specific player in the club data
    let playerData = null;

    if (Array.isArray(data)) {
      playerData = data.find(
        (p: unknown) => {
          const player = p as Record<string, unknown>;
          return String(player?.personaId || player?.id || player?.playerId || "") === String(personaId);
        }
      );
    } else if (typeof data === "object") {
      // Try different possible structures
      const dataObj = data as Record<string, unknown>;
      const members = dataObj.members || dataObj.players || data;
      if (Array.isArray(members)) {
        playerData = members.find(
          (p: unknown) => {
            const player = p as Record<string, unknown>;
            return String(player?.personaId || player?.id || player?.playerId || "") === String(personaId);
          }
        );
      } else if (typeof members === "object") {
        playerData = Object.values(members).find(
          (p: unknown) => {
            const player = p as Record<string, unknown>;
            return String(player?.personaId || player?.id || player?.playerId || "") === String(personaId);
          }
        );
      }
    }

    if (!playerData) {
      return NextResponse.json(
        { error: "Player not found in club" },
        { status: 404 }
      );
    }

    const resp = NextResponse.json(playerData);
    resp.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=300");
    return resp;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
