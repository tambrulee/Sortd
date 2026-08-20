import {
  ScheduleSettings,
  Weekday,
} from "@/lib/types";

export const WEEKDAYS: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const WEEKDAY_LABELS: Record<
  Weekday,
  string
> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function createDefaultScheduleSettings(
  timeZone = "Europe/London"
): ScheduleSettings {
  return {
    timeZone,
    planningHorizonDays: 14,
    bufferMinutes: 10,

    days: {
      monday: {
        enabled: true,
        wakeTime: "07:00",
        bedTime: "23:00",
        workStart: "09:00",
        workEnd: "17:00",
      },

      tuesday: {
        enabled: true,
        wakeTime: "07:00",
        bedTime: "23:00",
        workStart: "09:00",
        workEnd: "17:00",
      },

      wednesday: {
        enabled: true,
        wakeTime: "07:00",
        bedTime: "23:00",
        workStart: "09:00",
        workEnd: "17:00",
      },

      thursday: {
        enabled: true,
        wakeTime: "07:00",
        bedTime: "23:00",
        workStart: "09:00",
        workEnd: "17:00",
      },

      friday: {
        enabled: true,
        wakeTime: "07:00",
        bedTime: "23:00",
        workStart: "09:00",
        workEnd: "17:00",
      },

      saturday: {
        enabled: true,
        wakeTime: "08:00",
        bedTime: "23:30",
      },

      sunday: {
        enabled: true,
        wakeTime: "08:00",
        bedTime: "23:00",
      },
    },
  };
}