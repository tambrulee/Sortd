export type DurationOption = {
  value: number;
  label: string;
};

const shorterDurations: DurationOption[] = [
  { value: 5, label: "5 minutes" },
  { value: 10, label: "10 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1½ hours" },
];

const hourlyDurations: DurationOption[] =
  Array.from(
    { length: 23 },
    (_, index) => {
      const hours = index + 2;

      return {
        value: hours * 60,
        label: `${hours} hours`,
      };
    }
  );

export const DURATION_OPTIONS = [
  ...shorterDurations,
  ...hourlyDurations,
];