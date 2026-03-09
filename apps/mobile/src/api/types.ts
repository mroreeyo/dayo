// ── Auth ──

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  nickname: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfileDto {
  id: string;
  email: string;
  nickname: string;
}

export interface AuthResponseDto {
  tokens: AuthTokensDto;
  user: UserProfileDto;
}

// ── Shared ──

/** Revision is a BigInt serialized as string */
export type Revision = string;

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

// ── Calendars ──

export interface CalendarSummary {
  id: string;
  name: string;
  color?: string | null;
  role: MemberRole;
  revision: Revision;
}

export interface CreateCalendarDto {
  name: string;
  color?: string | null;
}

export interface UpdateCalendarDto {
  name?: string;
  color?: string | null;
}

export interface ListCalendarsResponse {
  items: CalendarSummary[];
}

// ── Events ──

export interface EventDto {
  id: string;
  calendarId: string;
  creatorId: string;
  title: string;
  note?: string | null;
  location?: string | null;
  timezone: string;
  allDay: boolean;
  startAtUtc?: string | null;
  endAtUtc?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  rrule?: string | null;
  color?: string | null;
  remindMinutes?: number | null;
  version: number;
  revision: Revision;
}

export interface OccurrenceDto {
  recurringEventId: string;
  occurrenceKey: string;
  startAtUtc?: string | null;
  endAtUtc?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  overridden: boolean;
}

export interface CreateEventDto {
  calendarId: string;
  title: string;
  note?: string | null;
  location?: string | null;
  timezone: string;
  allDay: boolean;
  startAtUtc?: string | null;
  endAtUtc?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  rrule?: string | null;
  color?: string | null;
  remindMinutes?: number | null;
}

export interface UpdateEventDto {
  title?: string;
  note?: string | null;
  location?: string | null;
  timezone?: string;
  allDay?: boolean;
  startAtUtc?: string | null;
  endAtUtc?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  rrule?: string | null;
  color?: string | null;
  remindMinutes?: number | null;
  version: number;
}

export interface ListEventsResponse {
  items: EventDto[];
  occurrences: OccurrenceDto[];
}

// ── Members ──

export interface MemberDto {
  userId: string;
  calendarId: string;
  role: MemberRole;
  nickname: string;
  joinedAt: string;
  revision: Revision;
}

export interface ListMembersResponse {
  items: MemberDto[];
}

export interface UpdateMemberRoleDto {
  role: MemberRole;
}

// ── Invites ──

export interface InviteDto {
  id: string;
  calendarId: string;
  code: string;
  expiresAt: string;
  revision: Revision;
}

export interface CreateInviteResponse {
  code: string;
  expiresAt: string;
}

export interface JoinByCodeResponse {
  calendarId: string;
  role: MemberRole;
}

// ── Sync ──

export interface SyncBucket<T> {
  upserts: T[];
  deletes: Array<{ id: string; revision: string; deletedAt?: string }>;
}

export interface SyncResponse {
  next: string;
  calendars: SyncBucket<CalendarSummary>;
  members: SyncBucket<MemberDto>;
  invites: SyncBucket<InviteDto>;
  events: SyncBucket<EventDto>;
}

// ── Realtime ──

export interface RealtimePayload {
  calendarId: string;
  revision: string;
  at: string;
  entityId?: string;
}
