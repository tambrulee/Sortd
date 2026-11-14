import { NextRequest, NextResponse } from "next/server";

const API = "https://api.unsplash.com";

function authHeaders(): HeadersInit | null {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  return key ? { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" } : null;
}

function errorMessage(status: number, action: "search" | "selection") {
  if (status === 429) return "Unsplash's request limit has been reached. Please try again later.";
  if (status === 403) return "Unsplash is refusing requests (often because the hourly demo limit is exhausted). Try again after the limit resets.";
  if (status === 401) return "Unsplash rejected the API access key.";
  return `Unsplash ${action} request failed (HTTP ${status}).`;
}

export async function GET(request: NextRequest) {
  const headers = authHeaders();
  if (!headers) return NextResponse.json({ error: "UNSPLASH_ACCESS_KEY is missing on the server." }, { status: 503 });
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  const page = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1));
  if (!q) return NextResponse.json({ results: [] });
  try {
    const response = await fetch(`${API}/search/photos?query=${encodeURIComponent(q)}&page=${page}&per_page=18`, { headers, cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: errorMessage(response.status, "search"), upstreamStatus: response.status }, { status: response.status });
    const data = await response.json();
    return NextResponse.json({ results: data.results.map((p: { id: string; urls: { regular: string }; user: { name: string; links: { html: string } }; links: { download_location: string } }) => ({
      id: p.id, url: p.urls.regular, photographer: p.user.name, photographerUrl: p.user.links.html, downloadLocation: p.links.download_location,
    })) });
  } catch {
    return NextResponse.json({ error: "Unable to contact Unsplash. Check your connection and try again." }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const headers = authHeaders();
  if (!headers) return NextResponse.json({ error: "UNSPLASH_ACCESS_KEY is missing on the server." }, { status: 503 });
  try {
    const body: unknown = await request.json();
    const raw = typeof body === "object" && body !== null && "downloadLocation" in body ? (body as { downloadLocation: unknown }).downloadLocation : null;
    if (typeof raw !== "string") return NextResponse.json({ error: "Missing download location." }, { status: 400 });
    const location = new URL(raw);
    if (location.protocol !== "https:" || location.hostname !== "api.unsplash.com" || location.port || location.username || location.password || !/^\/photos\/[a-zA-Z0-9_-]+\/download\/?$/.test(location.pathname)) {
      return NextResponse.json({ error: "Invalid Unsplash photo download location." }, { status: 400 });
    }
    const response = await fetch(location.toString(), { headers, cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: errorMessage(response.status, "selection"), upstreamStatus: response.status }, { status: response.status });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to register the Unsplash photo selection." }, { status: 400 });
  }
}
