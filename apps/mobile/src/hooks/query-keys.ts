export const queryKeys = {
  calendars: {
    all: ['calendars'] as const,
    list: () => [...queryKeys.calendars.all, 'list'] as const,
  },
  events: {
    all: ['events'] as const,
    list: (calendarId: string, from: string, to: string) =>
      [...queryKeys.events.all, 'list', calendarId, from, to] as const,
    byCalendar: (calendarId: string) =>
      [...queryKeys.events.all, 'byCalendar', calendarId] as const,
  },
  members: {
    all: ['members'] as const,
    list: (calendarId: string) =>
      [...queryKeys.members.all, 'list', calendarId] as const,
  },
} as const;
