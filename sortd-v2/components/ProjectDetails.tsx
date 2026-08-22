"use client";

import {
  ProjectStatus,
  ScheduleContext,
} from "@/lib/types";

import TimeWindowInput from "@/components/TimeWindowInput";

type ProjectDetailsProps = {
  description: string;
  status: ProjectStatus;

  scheduleContext: ScheduleContext;

  earliestStartTime?: string;
  latestEndTime?: string;

  onChangeDescription: (
    description: string
  ) => void;

  onChangeStatus: (
    status: ProjectStatus
  ) => void;

  onChangeScheduleContext: (
    context: ScheduleContext
  ) => void;

  onChangeEarliestStartTime: (
    time?: string
  ) => void;

  onChangeLatestEndTime: (
    time?: string
  ) => void;
};

export default function ProjectDetails({
  description,
  status,
  scheduleContext,
  earliestStartTime,
  latestEndTime,
  onChangeDescription,
  onChangeStatus,
  onChangeScheduleContext,
  onChangeEarliestStartTime,
  onChangeLatestEndTime,
}: ProjectDetailsProps) {
  return (
    <div className="mb-6 space-y-3">
      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <textarea
          value={description}
          onChange={(event) =>
            onChangeDescription(
              event.target.value
            )
          }
          placeholder="What does this project aim to achieve?"
          rows={2}
          className="resize-none rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
        />

        <select
          value={status}
          onChange={(event) =>
            onChangeStatus(
              event.target
                .value as ProjectStatus
            )
          }
          className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
        >
          <option value="active">
            Active
          </option>

          <option value="paused">
            Paused
          </option>

          <option value="completed">
            Completed
          </option>
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Default schedule

          <select
            value={scheduleContext}
            onChange={(event) =>
              onChangeScheduleContext(
                event.target
                  .value as ScheduleContext
              )
            }
            className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900"
          >
            <option value="personal">
              Personal hours
            </option>

            <option value="work">
              Working hours
            </option>

            <option value="any">
              Either
            </option>
          </select>
        </label>

        {/* Time Restrictions */}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
            Earliest start

            <TimeWindowInput
              value={
                earliestStartTime
              }
              onChange={
                onChangeEarliestStartTime
              }
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
            Must finish by

            <TimeWindowInput
              value={
                latestEndTime
              }
              onChange={
                onChangeLatestEndTime
              }
            />
          </label>
        </div>
      </div>
    </div>
  );
}