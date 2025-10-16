# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application for displaying EA Sports FC Pro Clubs statistics. It provides a search interface for clubs and displays team info, member stats, and recent matches by proxying requests to EA's Pro Clubs API.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production with Turbopack
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

Development server runs at http://localhost:3000

## Architecture

### API Proxy Layer (`src/app/api/ea/`)

All routes are Next.js API routes that proxy requests to `https://proclubs.ea.com/api` with appropriate headers:

- **`search-clubs/route.ts`** - Typeahead search by club name. Uses `/fc/allTimeLeaderboard/search` endpoint with short cache (120s).
- **`club-info/route.ts`** - Fetch club details by clubId(s). Uses `/fc/clubs/info` endpoint.
- **`members/route.ts`** - Fetch club member career stats by clubId. Uses `/fc/members/career/stats` with 300s cache.
- **`matches/route.ts`** - Fetch recent club matches (note: may return empty body).
- **`player/route.ts`** - Fetch individual player stats by personaId. Tries multiple candidate endpoints since EA changes these frequently.

All EA API routes include these headers:
```javascript
{
  accept: "application/json",
  origin: "https://www.ea.com",
  referer: "https://www.ea.com/",
  "user-agent": "Mozilla/5.0",
}
```

### Frontend (`src/app/page.tsx`)

Client-side React component with:

- **Typeahead search**: Debounced club name search (300ms) with AbortController for cancellation
- **Platform selector**: Supports `common-gen5` (current gen) and `common-gen4` (previous gen)
- **Scope toggle**: Display either club-only stats or career totals for members
- **Data normalization**: `normalizeMembers()` function handles varying EA API response shapes for member data
- **Safe JSON parsing**: `safeJson()` helper handles empty responses from EA API

The main fetch flow:
1. User types club name → typeahead suggestions appear
2. User selects club or enters numeric clubId → `fetchAll()` runs
3. Three parallel requests fetch club info, members, and matches
4. Members data is normalized based on selected scope (club/career)

### Key Patterns

- **Response shape handling**: EA API returns inconsistent shapes. Code normalizes by checking multiple possible field names (e.g., `row?.personaId ?? row?.id ?? row?.playerId ?? row?.persona?.id`).
- **Empty response handling**: Some endpoints return empty bodies. Use `safeJson()` to handle gracefully.
- **Caching**: API routes use Next.js `next: { revalidate }` for edge caching (120-300s).
- **Client-side scope switching**: Members data is stored with both raw response and normalized list, allowing instant UI updates when switching between club/career stats without refetching.

## Styling

Uses Tailwind CSS v4 with PostCSS. Custom fonts are Geist Sans and Geist Mono loaded via `next/font`.
