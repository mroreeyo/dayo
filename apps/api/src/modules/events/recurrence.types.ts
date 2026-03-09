export type OccurrenceKey = string; // ISO for timed, YYYY-MM-DD for all-day

export type OccurrenceResult = {
  recurringEventId: string;
  occurrenceKey: OccurrenceKey;
  calendarId: string;
  allDay: boolean;
  title: string;
  note?: string | null;
  location?: string | null;
  color?: string | null;
  timezone: string;
  // timed
  startAtUtc?: string;
  endAtUtc?: string;
  // all-day
  startDate?: string;
  endDate?: string;
  overridden: boolean;
};
