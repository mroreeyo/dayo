export const RT_EVENTS = {
  CALENDAR_UPDATED: 'calendar.updated',
  CALENDAR_DELETED: 'calendar.deleted',
  MEMBER_JOINED: 'member.joined',
  MEMBER_LEFT: 'member.left',
  MEMBER_ROLE_CHANGED: 'member.role_changed',
  EVENT_CREATED: 'event.created',
  EVENT_UPDATED: 'event.updated',
  EVENT_DELETED: 'event.deleted',
  CALENDAR_REMOVED: 'calendar.removed',
} as const;

export type RtEvent = (typeof RT_EVENTS)[keyof typeof RT_EVENTS];

export type RtPayload = {
  calendarId: string;
  revision: string;
  at: string;
  entityId?: string;
};
