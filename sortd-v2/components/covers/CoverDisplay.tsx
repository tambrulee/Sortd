"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import ProjectUploadedCover from "@/components/planner/project/ProjectUploadedCover";
import type { ProjectCover } from "@/lib/types";

export default function CoverDisplay({ cover, alt, className = "" }: { cover?: ProjectCover; alt: string; className?: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const imageUrl = cover?.source === "unsplash" ? cover.url : null;
  const failed = imageUrl !== null && failedUrl === imageUrl;
  return (
    <div className={`relative isolate overflow-hidden bg-gradient-to-br from-[#203e49] via-[#537b79] to-[#c4b79c] ${className}`}>
      {cover?.source === "unsplash" && !failed ? (
        <img src={cover.url} alt={alt} loading="lazy" onError={() => setFailedUrl(cover.url)} className="absolute inset-0 h-full w-full object-cover" />
      ) : cover?.source === "upload" ? (
        <div className="absolute inset-0 [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&>div]:h-full [&>div]:w-full"><ProjectUploadedCover path={cover.path} /></div>
      ) : (
        <div className="flex h-full items-center justify-center text-white/75"><Sparkles size={32} strokeWidth={1.4} /></div>
      )}
      {cover?.source === "unsplash" && !failed && cover.photographerUrl && (
        <a href={cover.photographerUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="absolute bottom-2 left-2 z-10 rounded bg-black/60 px-2 py-1 text-[10px] text-white">{cover.photographer} / Unsplash</a>
      )}
    </div>
  );
}
