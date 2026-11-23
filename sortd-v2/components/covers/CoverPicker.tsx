"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ProjectCover } from "@/lib/types";

type Photo = { id: string; url: string; photographer: string; photographerUrl: string; downloadLocation: string };
type SearchResponse = { results?: Photo[]; error?: string };
const searchCache = new Map<string, Photo[]>();

async function responseError(response: Response, fallback: string): Promise<string> {
  const data = await response.json().catch(() => null) as { error?: string } | null;
  return data?.error || `${fallback} (HTTP ${response.status})`;
}

export default function CoverPicker({ itemId, itemType, current, onSelect, onClose }: {
  itemId: string;
  itemType?: "project" | "routine" | "dream" | "goal" | "bucket list" | "workout";
  current?: ProjectCover;
  onSelect: (cover?: ProjectCover) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"unsplash" | "upload">("unsplash");
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  async function searchPhotos(term: string, nextPage = 1, force = false) {
    const trimmed = term.trim();
    if (!trimmed) {
      setError("Enter a search term first.");
      return;
    }
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setActiveQuery(trimmed);
    setPage(nextPage);
    setHasSearched(true);
    setError("");
    const key = `${trimmed.toLowerCase()}:${nextPage}`;
    const cached = !force ? searchCache.get(key) : undefined;
    if (cached) {
      setPhotos(cached);
      setLoading(false);
      return;
    }
    setPhotos([]);
    setLoading(true);
    try {
      const response = await fetch(`/api/unsplash/search?q=${encodeURIComponent(trimmed)}&page=${nextPage}`, { signal: controller.signal });
      if (!response.ok) throw new Error(await responseError(response, "Unable to load photos"));
      const data = await response.json() as SearchResponse;
      if (!Array.isArray(data.results)) throw new Error("Unexpected response from the photo service.");
      searchCache.set(key, data.results);
      if (!controller.signal.aborted) setPhotos(data.results);
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Search failed.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  async function choosePhoto(photo: Photo) {
    if (selectingId) return;
    setSelectingId(photo.id);
    setError("");
    try {
      // Unsplash API guidelines require a download event when a photo is chosen.
      const response = await fetch("/api/unsplash/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ downloadLocation: photo.downloadLocation }),
      });
      if (!response.ok) throw new Error(await responseError(response, "Could not register the photo selection"));
      onSelect({ source: "unsplash", url: photo.url, photographer: photo.photographer, photographerUrl: photo.photographerUrl, unsplashId: photo.id });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to select this photo.");
    } finally {
      setSelectingId(null);
    }
  }

  async function upload(file: File) {
    setLoading(true);
    setError("");
    try {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPEG, PNG or WebP image.");
      if (file.size > 5 * 1024 * 1024) throw new Error("Images must be 5 MB or smaller.");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in to upload images.");
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/${itemId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("project-covers").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      onSelect({ source: "upload", path });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-3" role="dialog" aria-modal="true" aria-label="Choose cover">
    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-[var(--sortd-card)] p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Choose a {itemType ?? "project"} cover</h2><button type="button" onClick={onClose} aria-label="Close">✕</button></div>
      <div className="mb-4 flex gap-2"><button type="button" onClick={() => setTab("unsplash")} className={`rounded-lg px-3 py-2 text-sm ${tab === "unsplash" ? "bg-[var(--sortd-muted)] font-semibold" : ""}`}>Unsplash library</button><button type="button" onClick={() => setTab("upload")} className={`rounded-lg px-3 py-2 text-sm ${tab === "upload" ? "bg-[var(--sortd-muted)] font-semibold" : ""}`}>Upload your own</button></div>
      {tab === "unsplash" ? <>
        <form onSubmit={e => { e.preventDefault(); void searchPhotos(query, 1); }} className="mb-4 flex gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search Unsplash photos" aria-label="Search Unsplash photos" className="min-w-0 flex-1 rounded-xl border border-[var(--sortd-border)] p-3 text-sm" />
          <button type="submit" disabled={loading || !query.trim()} className="rounded-xl bg-[var(--sortd-muted)] px-4 py-2 text-sm font-semibold disabled:opacity-50">Search</button>
        </form>
        {!hasSearched && <p className="py-6 text-center text-sm text-slate-500">Search for a cover. Photos won&apos;t load until you press Search.</p>}
        {hasSearched && !loading && !error && photos.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No photos found. Try another search.</p>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.map(photo => <button key={photo.id} type="button" disabled={selectingId !== null} onClick={() => void choosePhoto(photo)} className="overflow-hidden rounded-xl border border-[var(--sortd-border)] text-left disabled:opacity-60"><img src={photo.url} className="h-28 w-full object-cover" /><span className="block p-2 text-xs">{selectingId === photo.id ? "Selecting…" : `${photo.photographer} · Unsplash`}</span></button>)}</div>
        {hasSearched && photos.length > 0 && <div className="mt-4 flex items-center justify-between gap-3"><button type="button" disabled={page === 1 || loading} onClick={() => void searchPhotos(activeQuery, page - 1)}>Previous</button><span className="text-xs">Page {page}</span><button type="button" disabled={loading} onClick={() => void searchPhotos(activeQuery, page + 1)}>Next</button></div>}
        {error && hasSearched && <button type="button" onClick={() => void searchPhotos(activeQuery, page, true)} className="mt-3 text-sm font-medium underline">Retry photo search</button>}
      </> : <label className="block cursor-pointer rounded-xl border border-dashed border-[var(--sortd-border)] p-10 text-center text-sm">Choose a JPEG, PNG or WebP (max 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) void upload(f); }} /></label>}
      {loading && <p className="mt-3 text-sm">Loading…</p>}{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {current && <button type="button" className="mt-4 text-sm text-red-700" onClick={() => onSelect(undefined)}>Remove cover</button>}
    </div>
  </div>;
}
