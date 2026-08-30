"use client";

import { ScheduleSettings } from "@/lib/types";

import ScheduleSettingsView from "@/components/settings/ScheduleSettingsView";

type EnergyPattern = "morning" | "balanced" | "evening";

type ScheduleSettingsWithRhythm = ScheduleSettings & {
  energyPattern?: EnergyPattern;
};

type SettingsControlPanelProps = {
  settings: ScheduleSettingsWithRhythm;

  onChangeSettings: (settings: ScheduleSettingsWithRhythm) => void;
};

const rhythmOptions: Array<{
  value: EnergyPattern;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    value: "morning",
    title: "Morning person",
    description: "Your strongest energy tends to arrive earlier in the day.",
    icon: "☀",
  },
  {
    value: "balanced",
    title: "Pretty balanced",
    description: "Your energy is fairly even across the day.",
    icon: "◐",
  },
  {
    value: "evening",
    title: "Night owl",
    description: "You tend to hit your stride later in the day and evening.",
    icon: "☾",
  },
];

export default function SettingsControlPanel({
  settings,
  onChangeSettings,
}: SettingsControlPanelProps) {
  const energyPattern = settings.energyPattern ?? "balanced";

  function updateEnergyPattern(value: EnergyPattern) {
    onChangeSettings({
      ...settings,
      energyPattern: value,
    });
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-md md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9d3db7]">
          Settings
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-950">
          How Sort’d plans around you
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Set your usual rhythm, availability and working hours once. The
          planner can use these as the rules for your rolling schedule.
        </p>
      </header>

      <section className="rounded-3xl bg-white/85 p-5 shadow-lg backdrop-blur-md md:p-7">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9d3db7]">
            Your rhythm
          </p>

          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            When are you usually at your best?
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            This will become a scheduling preference, not a hard restriction.
            Deadlines and fixed constraints can still take priority.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {rhythmOptions.map((option) => {
            const selected = energyPattern === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateEnergyPattern(option.value)}
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-[#cd6ce7] bg-purple-50 ring-2 ring-[#cd6ce7]/20"
                    : "border-slate-200 bg-[#f8f5f5] hover:border-slate-300"
                }`}
              >
                <span className="text-2xl">{option.icon}</span>

                <p className="mt-3 font-semibold text-slate-950">
                  {option.title}
                </p>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl bg-white/85 p-5 shadow-lg backdrop-blur-md md:p-7">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9d3db7]">
            Availability & working hours
          </p>

          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Tell Sort’d when your time is actually available
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            These are the same scheduling controls that previously lived inside
            Planner.
          </p>
        </div>

        <ScheduleSettingsView
          settings={settings}
          onChangeSettings={onChangeSettings}
        />
      </section>
    </div>
  );
}
