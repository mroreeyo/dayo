import { Injectable } from '@nestjs/common';
import { Event, EventException, EventRecurrenceRule } from '@prisma/client';
import { RRule, rrulestr } from 'rrule';
import { OccurrenceResult } from './recurrence.types';

function toIso(d: Date): string {
  return d.toISOString();
}

function toDateKey(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export type MasterEvent = Pick<
  Event,
  | 'id'
  | 'calendarId'
  | 'title'
  | 'note'
  | 'location'
  | 'color'
  | 'timezone'
  | 'allDay'
  | 'startAtUtc'
  | 'endAtUtc'
  | 'startDate'
  | 'endDate'
>;

export type RuleInput = Pick<
  EventRecurrenceRule,
  'rrule' | 'dtstartUtc' | 'dtstartDate' | 'untilUtc' | 'count'
>;

export type ExceptionInput = Pick<
  EventException,
  'exceptionKey' | 'action' | 'overridePayload' | 'deletedAt'
>;

@Injectable()
export class RecurrenceService {
  private parseRule(rruleText: string, dtstart: Date): RRule {
    const t = rruleText.trim();
    const normalized = t.startsWith('RRULE:') ? t : `RRULE:${t}`;
    const parsed = rrulestr(normalized, { dtstart, forceset: false });
    return parsed as RRule;
  }

  expandOne(
    master: MasterEvent,
    rule: RuleInput,
    exceptions: ExceptionInput[],
    range: { from: Date; to: Date },
  ): OccurrenceResult[] {
    const exMap = new Map<string, ExceptionInput>();
    for (const ex of exceptions) {
      if (ex.deletedAt) continue;
      exMap.set(ex.exceptionKey, ex);
    }

    let dtstart: Date;
    if (!master.allDay) {
      const d = rule.dtstartUtc ?? master.startAtUtc;
      if (!d) return [];
      dtstart = d instanceof Date ? d : new Date(d as string);
    } else {
      const d = rule.dtstartDate ?? master.startDate;
      if (!d) return [];
      const dateVal = d instanceof Date ? d : new Date(d as string);
      dtstart = new Date(
        Date.UTC(
          dateVal.getUTCFullYear(),
          dateVal.getUTCMonth(),
          dateVal.getUTCDate(),
          0,
          0,
          0,
        ),
      );
    }

    const r = this.parseRule(rule.rrule, dtstart);
    const starts = r.between(range.from, range.to, true);

    let durationMs = 0;
    if (!master.allDay) {
      if (!master.startAtUtc || !master.endAtUtc) return [];
      const startMs = (
        master.startAtUtc instanceof Date
          ? master.startAtUtc
          : new Date(String(master.startAtUtc))
      ).getTime();
      const endMs = (
        master.endAtUtc instanceof Date
          ? master.endAtUtc
          : new Date(String(master.endAtUtc))
      ).getTime();
      durationMs = endMs - startMs;
      if (durationMs <= 0) return [];
    } else {
      if (!master.startDate || !master.endDate) return [];
      const dayMs = 24 * 60 * 60 * 1000;
      const sd =
        master.startDate instanceof Date
          ? master.startDate
          : new Date(String(master.startDate));
      const ed =
        master.endDate instanceof Date
          ? master.endDate
          : new Date(String(master.endDate));
      const days = Math.round((ed.getTime() - sd.getTime()) / dayMs);
      durationMs = Math.max(1, days) * dayMs;
    }

    const out: OccurrenceResult[] = [];

    for (const start of starts) {
      const occurrenceKey = master.allDay ? toDateKey(start) : toIso(start);

      const ex = exMap.get(occurrenceKey);
      if (ex?.action === 'CANCEL') continue;

      let occ: OccurrenceResult;
      if (!master.allDay) {
        const end = new Date(start.getTime() + durationMs);
        occ = {
          recurringEventId: master.id,
          occurrenceKey,
          calendarId: master.calendarId,
          allDay: false,
          title: master.title,
          note: master.note ?? null,
          location: master.location ?? null,
          color: master.color ?? null,
          timezone: master.timezone,
          startAtUtc: toIso(start),
          endAtUtc: toIso(end),
          overridden: false,
        };
      } else {
        const startDateKey = toDateKey(start);
        const endDate = new Date(start.getTime() + durationMs);
        occ = {
          recurringEventId: master.id,
          occurrenceKey,
          calendarId: master.calendarId,
          allDay: true,
          title: master.title,
          note: master.note ?? null,
          location: master.location ?? null,
          color: master.color ?? null,
          timezone: master.timezone,
          startDate: startDateKey,
          endDate: toDateKey(endDate),
          overridden: false,
        };
      }

      if (ex?.action === 'OVERRIDE' && ex.overridePayload) {
        const p = ex.overridePayload as Record<string, unknown>;
        occ = {
          ...occ,
          ...(p.title !== undefined ? { title: p.title as string } : {}),
          ...(p.note !== undefined ? { note: p.note as string | null } : {}),
          ...(p.location !== undefined
            ? { location: p.location as string | null }
            : {}),
          ...(p.color !== undefined ? { color: p.color as string | null } : {}),
          ...(p.startAtUtc !== undefined
            ? { startAtUtc: p.startAtUtc as string }
            : {}),
          ...(p.endAtUtc !== undefined
            ? { endAtUtc: p.endAtUtc as string }
            : {}),
          ...(p.startDate !== undefined
            ? { startDate: p.startDate as string }
            : {}),
          ...(p.endDate !== undefined
            ? { endDate: p.endDate as string }
            : {}),
          overridden: true,
          occurrenceKey,
          recurringEventId: master.id,
          calendarId: master.calendarId,
        };
      }

      out.push(occ);
    }

    return out;
  }

  expandMany(
    masters: Array<{
      event: MasterEvent;
      rule: RuleInput;
      exceptions: ExceptionInput[];
    }>,
    range: { from: Date; to: Date },
  ): OccurrenceResult[] {
    const all: OccurrenceResult[] = [];
    for (const m of masters) {
      all.push(...this.expandOne(m.event, m.rule, m.exceptions, range));
    }
    return all;
  }
}
