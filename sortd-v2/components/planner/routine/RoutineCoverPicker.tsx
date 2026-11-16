"use client";
import CoverPicker from "@/components/covers/CoverPicker";
import type { ProjectCover } from "@/lib/types";
export default function RoutineCoverPicker({ projectId, current, onSelect, onClose }: {
  projectId: string;
  current?: ProjectCover;
  onSelect: (cover?: ProjectCover) => void;
  onClose: () => void;
}) {
  return <CoverPicker itemId={projectId} itemType="routine" current={current} onSelect={onSelect} onClose={onClose} />;
}
