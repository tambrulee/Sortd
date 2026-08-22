"use client";

import { useId } from "react";

type TimeWindowInputProps = {
  value?: string;
  onChange: (value?: string) => void;
  placeholder?: string;
};

const TIME_OPTIONS = Array.from(
  { length: 24 * 4 },
  (_, index) => {
    const totalMinutes = index * 15;

    const hour = Math.floor(
      totalMinutes / 60
    );

    const minute =
      totalMinutes % 60;

    return `${String(hour).padStart(
      2,
      "0"
    )}:${String(minute).padStart(
      2,
      "0"
    )}`;
  }
);

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(
    value
  );
}

export default function TimeWindowInput({
  value,
  onChange,
  placeholder = "HH:MM",
}: TimeWindowInputProps) {
  const listId = useId();

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const nextValue =
      event.target.value.trim();

    // Explicitly removing the value
    if (!nextValue) {
      onChange(undefined);
      return;
    }

    // Only commit to task/project state
    // once we have a complete valid time.
    if (isValidTime(nextValue)) {
      onChange(nextValue);
    }
  }

  function handleBlur(
    event: React.FocusEvent<HTMLInputElement>
  ) {
    const nextValue =
      event.target.value.trim();

    if (!nextValue) {
      onChange(undefined);
      return;
    }

    if (isValidTime(nextValue)) {
      onChange(nextValue);
      return;
    }

    // Invalid/incomplete input:
    // restore the last saved value.
    event.currentTarget.value =
      value ?? "";
  }

  return (
    <>
      <input
        key={value ?? "empty"}
        type="text"
        inputMode="numeric"
        defaultValue={value ?? ""}
        list={listId}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={handleBlur}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#cd6ce7] focus:ring-2 focus:ring-[#cd6ce7]/20"
      />

      <datalist id={listId}>
        {TIME_OPTIONS.map(
          (time) => (
            <option
              key={time}
              value={time}
            />
          )
        )}
      </datalist>
    </>
  );
}