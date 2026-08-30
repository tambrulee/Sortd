"use client";

import { DayAvailability, ScheduleSettings, Weekday } from "@/lib/types";
import { WEEKDAYS, WEEKDAY_LABELS } from "@/lib/schedule";

type ScheduleSettingsViewProps = {
  settings: ScheduleSettings;
  onChangeSettings: (settings: ScheduleSettings) => void;
};

export default function ScheduleSettingsView({
  settings,
  onChangeSettings,
}: ScheduleSettingsViewProps) {
  function updateDay(weekday: Weekday, updates: Partial<DayAvailability>) {
    onChangeSettings({
      ...settings,
      days: {
        ...settings.days,
        [weekday]: {
          ...settings.days[weekday],
          ...updates,
        },
      },
    });
  }

  function useDeviceTimeZone() {
    const timeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London";

    onChangeSettings({
      ...settings,
      timeZone,
    });
  }

  return (
    <div className="rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-md md:p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9d3db7]">
          Planner
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-950">
          Weekly availability
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Tell Sort&apos;d when you sleep and work. It will use the remaining
          time when building your schedule.
        </p>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h2 className="font-semibold text-slate-900">Scheduling preferences</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Time zone
            <div className="flex gap-2">
              <input
                value={settings.timeZone}
                onChange={(event) =>
                  onChangeSettings({
                    ...settings,
                    timeZone: event.target.value,
                  })
                }
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
              />

              <button
                type="button"
                onClick={useDeviceTimeZone}
                className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-300"
              >
                Detect
              </button>
            </div>
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Plan ahead
            <select
              value={settings.planningHorizonDays}
              onChange={(event) =>
                onChangeSettings({
                  ...settings,
                  planningHorizonDays: Number(event.target.value),
                })
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
            >
              <option value="7">1 week</option>
              <option value="14">2 weeks</option>
              <option value="30">30 days</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Time between tasks
            <select
              value={settings.bufferMinutes}
              onChange={(event) =>
                onChangeSettings({
                  ...settings,
                  bufferMinutes: Number(event.target.value),
                })
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
            >
              <option value="0">No buffer</option>
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
            </select>
          </label>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Your normal week</h2>

          <p className="text-sm text-slate-500">
            Leave work times empty on days you do not normally work.
          </p>
        </div>

        <div className="space-y-3">
          {WEEKDAYS.map((weekday) => {
            const day = settings.days[weekday];

            return (
              <div
                key={weekday}
                className={`rounded-2xl border p-4 ${
                  day.enabled
                    ? "border-slate-200 bg-white"
                    : "border-slate-100 bg-slate-50 opacity-60"
                }`}
              >
                <div className="grid gap-4 lg:grid-cols-[140px_repeat(4,1fr)] lg:items-end">
                  <label className="flex items-center gap-3 font-semibold text-slate-900">
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={(event) =>
                        updateDay(weekday, {
                          enabled: event.target.checked,
                        })
                      }
                      className="h-5 w-5 accent-[#cd6ce7]"
                    />

                    {WEEKDAY_LABELS[weekday]}
                  </label>

                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                    Wake up
                    <input
                      type="time"
                      value={day.wakeTime}
                      disabled={!day.enabled}
                      onChange={(event) =>
                        updateDay(weekday, {
                          wakeTime: event.target.value,
                        })
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                    Start work
                    <input
                      type="time"
                      value={day.workStart ?? ""}
                      disabled={!day.enabled}
                      onChange={(event) =>
                        updateDay(weekday, {
                          workStart: event.target.value || undefined,
                        })
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                    Finish work
                    <input
                      type="time"
                      value={day.workEnd ?? ""}
                      disabled={!day.enabled}
                      onChange={(event) =>
                        updateDay(weekday, {
                          workEnd: event.target.value || undefined,
                        })
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                    Bedtime
                    <input
                      type="time"
                      value={day.bedTime}
                      disabled={!day.enabled}
                      onChange={(event) =>
                        updateDay(weekday, {
                          bedTime: event.target.value,
                        })
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
