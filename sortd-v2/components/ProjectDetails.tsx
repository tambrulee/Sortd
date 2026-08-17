"use client";

import { ProjectStatus } from "@/lib/types";

type ProjectDetailsProps = {
  description: string;
  status: ProjectStatus;
  onChangeDescription: (description: string) => void;
  onChangeStatus: (status: ProjectStatus) => void;
};

export default function ProjectDetails({
  description,
  status,
  onChangeDescription,
  onChangeStatus,
}: ProjectDetailsProps) {
  return (
    <div className="mb-6 grid gap-3 md:grid-cols-[1fr_180px]">
      <textarea
        value={description}
        onChange={(event) => onChangeDescription(event.target.value)}
        placeholder="What does this project aim to achieve?"
        rows={2}
        className="resize-none rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
      />

      <select
        value={status}
        onChange={(event) =>
          onChangeStatus(event.target.value as ProjectStatus)
        }
        className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
      >
        <option value="active">Active</option>
        <option value="paused">Paused</option>
        <option value="completed">Completed</option>
      </select>
    </div>
  );
}