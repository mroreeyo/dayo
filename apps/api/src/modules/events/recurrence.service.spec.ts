import { RecurrenceService, ExceptionInput } from './recurrence.service';

describe('RecurrenceService', () => {
  let service: RecurrenceService;

  beforeEach(() => {
    service = new RecurrenceService();
  });

  const masterId = 'evt-recurring-1';
  const calendarId = 'cal-1';

  const timedMaster = {
    id: masterId,
    calendarId,
    title: 'Daily Standup',
    note: 'Team sync',
    location: 'Room A',
    color: '#00AA00',
    timezone: 'Asia/Seoul',
    allDay: false as const,
    startAtUtc: new Date('2026-03-01T09:00:00Z'),
    endAtUtc: new Date('2026-03-01T10:00:00Z'),
    startDate: null,
    endDate: null,
  };

  const allDayMaster = {
    id: 'evt-allday-1',
    calendarId,
    title: 'Holiday',
    note: null,
    location: null,
    color: '#FF0000',
    timezone: 'Asia/Seoul',
    allDay: true as const,
    startAtUtc: null,
    endAtUtc: null,
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-03-02'),
  };

  const makeRule = (rrule: string, dtstart: Date, allDay = false) => ({
    rrule,
    dtstartUtc: allDay ? null : dtstart,
    dtstartDate: allDay ? dtstart : null,
    untilUtc: null,
    count: null,
  });

  const noExceptions: ExceptionInput[] = [];

  describe('daily recurrence', () => {
    it('expands 7 occurrences for a 7-day range', () => {
      const rule = makeRule('FREQ=DAILY', new Date('2026-03-01T09:00:00Z'));
      const range = {
        from: new Date('2026-03-01T00:00:00Z'),
        to: new Date('2026-03-07T23:59:59Z'),
      };

      const results = service.expandOne(timedMaster, rule, noExceptions, range);

      expect(results).toHaveLength(7);
      expect(results[0].startAtUtc).toBe('2026-03-01T09:00:00.000Z');
      expect(results[0].endAtUtc).toBe('2026-03-01T10:00:00.000Z');
      expect(results[6].startAtUtc).toBe('2026-03-07T09:00:00.000Z');
      expect(results[6].endAtUtc).toBe('2026-03-07T10:00:00.000Z');

      for (const occ of results) {
        expect(occ.recurringEventId).toBe(masterId);
        expect(occ.calendarId).toBe(calendarId);
        expect(occ.allDay).toBe(false);
        expect(occ.title).toBe('Daily Standup');
        expect(occ.note).toBe('Team sync');
        expect(occ.location).toBe('Room A');
        expect(occ.color).toBe('#00AA00');
        expect(occ.timezone).toBe('Asia/Seoul');
        expect(occ.overridden).toBe(false);
      }
    });
  });

  describe('weekly with BYDAY', () => {
    it('returns occurrences only on MO, WE, FR', () => {
      const rule = makeRule(
        'FREQ=WEEKLY;BYDAY=MO,WE,FR',
        new Date('2026-03-02T09:00:00Z'),
      );
      const range = {
        from: new Date('2026-03-01T00:00:00Z'),
        to: new Date('2026-03-15T00:00:00Z'),
      };

      const results = service.expandOne(timedMaster, rule, noExceptions, range);

      expect(results).toHaveLength(6);
      const days = results.map((r) => new Date(r.startAtUtc!).getUTCDay());
      expect(days).toEqual([1, 3, 5, 1, 3, 5]);
    });
  });

  describe('monthly with BYMONTHDAY', () => {
    it('returns the 15th of each month', () => {
      const master = {
        ...timedMaster,
        startAtUtc: new Date('2026-01-15T10:00:00Z'),
        endAtUtc: new Date('2026-01-15T11:00:00Z'),
      };
      const rule = makeRule(
        'FREQ=MONTHLY;BYMONTHDAY=15',
        new Date('2026-01-15T10:00:00Z'),
      );
      const range = {
        from: new Date('2026-01-01T00:00:00Z'),
        to: new Date('2026-06-01T00:00:00Z'),
      };

      const results = service.expandOne(master, rule, noExceptions, range);

      expect(results).toHaveLength(5);
      const dates = results.map((r) => new Date(r.startAtUtc!).getUTCDate());
      expect(dates).toEqual([15, 15, 15, 15, 15]);
      const months = results.map(
        (r) => new Date(r.startAtUtc!).getUTCMonth() + 1,
      );
      expect(months).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('yearly recurrence', () => {
    it('returns one occurrence per year', () => {
      const rule = makeRule('FREQ=YEARLY', new Date('2026-03-01T12:00:00Z'));
      const master = {
        ...timedMaster,
        startAtUtc: new Date('2026-03-01T12:00:00Z'),
        endAtUtc: new Date('2026-03-01T13:00:00Z'),
      };
      const range = {
        from: new Date('2026-01-01T00:00:00Z'),
        to: new Date('2029-01-01T00:00:00Z'),
      };

      const results = service.expandOne(master, rule, noExceptions, range);

      expect(results).toHaveLength(3);
      expect(results[0].startAtUtc).toBe('2026-03-01T12:00:00.000Z');
      expect(results[1].startAtUtc).toBe('2027-03-01T12:00:00.000Z');
      expect(results[2].startAtUtc).toBe('2028-03-01T12:00:00.000Z');
    });
  });

  describe('COUNT limit', () => {
    it('returns exactly COUNT occurrences', () => {
      const rule = makeRule(
        'FREQ=DAILY;COUNT=5',
        new Date('2026-03-01T09:00:00Z'),
      );
      const range = {
        from: new Date('2026-03-01T00:00:00Z'),
        to: new Date('2026-03-31T00:00:00Z'),
      };

      const results = service.expandOne(timedMaster, rule, noExceptions, range);

      expect(results).toHaveLength(5);
      expect(results[4].startAtUtc).toBe('2026-03-05T09:00:00.000Z');
    });
  });

  describe('UNTIL limit', () => {
    it('returns no occurrences after UNTIL date', () => {
      const rule = makeRule(
        'FREQ=DAILY;UNTIL=20260305T000000Z',
        new Date('2026-03-01T00:00:00Z'),
      );
      const master = {
        ...timedMaster,
        startAtUtc: new Date('2026-03-01T00:00:00Z'),
        endAtUtc: new Date('2026-03-01T01:00:00Z'),
      };
      const range = {
        from: new Date('2026-03-01T00:00:00Z'),
        to: new Date('2026-03-31T00:00:00Z'),
      };

      const results = service.expandOne(master, rule, noExceptions, range);

      expect(results).toHaveLength(5);
      const lastStart = results[results.length - 1].startAtUtc!;
      expect(new Date(lastStart).getTime()).toBeLessThanOrEqual(
        new Date('2026-03-05T00:00:00Z').getTime(),
      );
    });
  });

  describe('INTERVAL', () => {
    it('expands every other day with INTERVAL=2', () => {
      const rule = makeRule(
        'FREQ=DAILY;INTERVAL=2',
        new Date('2026-03-01T09:00:00Z'),
      );
      const range = {
        from: new Date('2026-03-01T00:00:00Z'),
        to: new Date('2026-03-10T00:00:00Z'),
      };

      const results = service.expandOne(timedMaster, rule, noExceptions, range);

      expect(results).toHaveLength(5);
      expect(results[0].startAtUtc).toBe('2026-03-01T09:00:00.000Z');
      expect(results[1].startAtUtc).toBe('2026-03-03T09:00:00.000Z');
      expect(results[2].startAtUtc).toBe('2026-03-05T09:00:00.000Z');
      expect(results[3].startAtUtc).toBe('2026-03-07T09:00:00.000Z');
      expect(results[4].startAtUtc).toBe('2026-03-09T09:00:00.000Z');
    });
  });

  describe('CANCEL exception', () => {
    it('removes the cancelled occurrence from results', () => {
      const rule = makeRule('FREQ=DAILY', new Date('2026-03-01T09:00:00Z'));
      const range = {
        from: new Date('2026-03-01T00:00:00Z'),
        to: new Date('2026-03-03T23:59:59Z'),
      };
      const exceptions: ExceptionInput[] = [
        {
          exceptionKey: '2026-03-02T09:00:00.000Z',
          action: 'CANCEL',
          overridePayload: null,
          deletedAt: null,
        },
      ];

      const results = service.expandOne(timedMaster, rule, exceptions, range);

      expect(results).toHaveLength(2);
      expect(results[0].startAtUtc).toBe('2026-03-01T09:00:00.000Z');
      expect(results[1].startAtUtc).toBe('2026-03-03T09:00:00.000Z');
    });
  });

  describe('OVERRIDE exception', () => {
    it('replaces fields but preserves occurrenceKey and identity', () => {
      const rule = makeRule('FREQ=DAILY', new Date('2026-03-01T09:00:00Z'));
      const range = {
        from: new Date('2026-03-01T00:00:00Z'),
        to: new Date('2026-03-03T23:59:59Z'),
      };
      const exceptions: ExceptionInput[] = [
        {
          exceptionKey: '2026-03-02T09:00:00.000Z',
          action: 'OVERRIDE',
          overridePayload: {
            title: 'Overridden Meeting',
            location: 'Room B',
          },
          deletedAt: null,
        },
      ];

      const results = service.expandOne(timedMaster, rule, exceptions, range);

      expect(results).toHaveLength(3);

      const overridden = results.find(
        (r) => r.occurrenceKey === '2026-03-02T09:00:00.000Z',
      )!;
      expect(overridden.title).toBe('Overridden Meeting');
      expect(overridden.location).toBe('Room B');
      expect(overridden.overridden).toBe(true);
      expect(overridden.recurringEventId).toBe(masterId);
      expect(overridden.calendarId).toBe(calendarId);
      expect(overridden.occurrenceKey).toBe('2026-03-02T09:00:00.000Z');

      const normal = results.find(
        (r) => r.occurrenceKey === '2026-03-01T09:00:00.000Z',
      )!;
      expect(normal.title).toBe('Daily Standup');
      expect(normal.overridden).toBe(false);
    });
  });

  describe('empty range', () => {
    it('returns empty array when range is before RRULE start', () => {
      const rule = makeRule('FREQ=DAILY', new Date('2026-03-01T09:00:00Z'));
      const range = {
        from: new Date('2026-01-01T00:00:00Z'),
        to: new Date('2026-02-01T00:00:00Z'),
      };

      const results = service.expandOne(timedMaster, rule, noExceptions, range);

      expect(results).toEqual([]);
    });
  });

  describe('all-day daily recurrence', () => {
    it('uses YYYY-MM-DD dateKey format for occurrenceKey', () => {
      const rule = makeRule(
        'FREQ=DAILY',
        new Date('2026-03-01T00:00:00Z'),
        true,
      );
      const range = {
        from: new Date('2026-03-01T00:00:00Z'),
        to: new Date('2026-03-04T00:00:00Z'),
      };

      const results = service.expandOne(allDayMaster, rule, noExceptions, range);

      expect(results).toHaveLength(4);
      expect(results[0].occurrenceKey).toBe('2026-03-01');
      expect(results[0].startDate).toBe('2026-03-01');
      expect(results[0].endDate).toBe('2026-03-02');
      expect(results[0].allDay).toBe(true);
      expect(results[0].startAtUtc).toBeUndefined();
      expect(results[0].endAtUtc).toBeUndefined();

      expect(results[3].occurrenceKey).toBe('2026-03-04');
      expect(results[3].startDate).toBe('2026-03-04');
      expect(results[3].endDate).toBe('2026-03-05');
    });
  });

  describe('all-day multi-day event', () => {
    it('preserves 2-day duration across occurrences', () => {
      const multiDayMaster = {
        ...allDayMaster,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-03'),
      };
      const rule = makeRule(
        'FREQ=DAILY',
        new Date('2026-03-01T00:00:00Z'),
        true,
      );
      const range = {
        from: new Date('2026-03-01T00:00:00Z'),
        to: new Date('2026-03-03T00:00:00Z'),
      };

      const results = service.expandOne(
        multiDayMaster,
        rule,
        noExceptions,
        range,
      );

      expect(results).toHaveLength(3);
      expect(results[0].startDate).toBe('2026-03-01');
      expect(results[0].endDate).toBe('2026-03-03');
      expect(results[1].startDate).toBe('2026-03-02');
      expect(results[1].endDate).toBe('2026-03-04');
      expect(results[2].startDate).toBe('2026-03-03');
      expect(results[2].endDate).toBe('2026-03-05');
    });
  });

  describe('expandMany', () => {
    it('expands multiple masters correctly', () => {
      const master2 = {
        ...timedMaster,
        id: 'evt-recurring-2',
        title: 'Lunch',
        startAtUtc: new Date('2026-03-01T12:00:00Z'),
        endAtUtc: new Date('2026-03-01T13:00:00Z'),
      };
      const rule1 = makeRule(
        'FREQ=DAILY;COUNT=2',
        new Date('2026-03-01T09:00:00Z'),
      );
      const rule2 = makeRule(
        'FREQ=DAILY;COUNT=3',
        new Date('2026-03-01T12:00:00Z'),
      );
      const range = {
        from: new Date('2026-03-01T00:00:00Z'),
        to: new Date('2026-03-31T00:00:00Z'),
      };

      const results = service.expandMany(
        [
          { event: timedMaster, rule: rule1, exceptions: noExceptions },
          { event: master2, rule: rule2, exceptions: noExceptions },
        ],
        range,
      );

      expect(results).toHaveLength(5);
      const standups = results.filter(
        (r) => r.recurringEventId === masterId,
      );
      const lunches = results.filter(
        (r) => r.recurringEventId === 'evt-recurring-2',
      );
      expect(standups).toHaveLength(2);
      expect(lunches).toHaveLength(3);
    });
  });

  describe('RRULE: prefix handling', () => {
    it('handles rrule string with RRULE: prefix', () => {
      const rule = makeRule(
        'RRULE:FREQ=DAILY;COUNT=3',
        new Date('2026-03-01T09:00:00Z'),
      );
      const range = {
        from: new Date('2026-03-01T00:00:00Z'),
        to: new Date('2026-03-31T00:00:00Z'),
      };

      const results = service.expandOne(timedMaster, rule, noExceptions, range);

      expect(results).toHaveLength(3);
    });
  });

  describe('no prefix handling', () => {
    it('handles rrule string without RRULE: prefix', () => {
      const rule = makeRule(
        'FREQ=DAILY;COUNT=3',
        new Date('2026-03-01T09:00:00Z'),
      );
      const range = {
        from: new Date('2026-03-01T00:00:00Z'),
        to: new Date('2026-03-31T00:00:00Z'),
      };

      const results = service.expandOne(timedMaster, rule, noExceptions, range);

      expect(results).toHaveLength(3);
    });
  });

  describe('duration preservation', () => {
    it('preserves 90-minute duration for each timed occurrence', () => {
      const master = {
        ...timedMaster,
        startAtUtc: new Date('2026-03-01T09:00:00Z'),
        endAtUtc: new Date('2026-03-01T10:30:00Z'), // 90 minutes
      };
      const rule = makeRule('FREQ=DAILY', new Date('2026-03-01T09:00:00Z'));
      const range = {
        from: new Date('2026-03-01T00:00:00Z'),
        to: new Date('2026-03-03T23:59:59Z'),
      };

      const results = service.expandOne(master, rule, noExceptions, range);

      expect(results).toHaveLength(3);
      for (const occ of results) {
        const start = new Date(occ.startAtUtc!).getTime();
        const end = new Date(occ.endAtUtc!).getTime();
        const durationMinutes = (end - start) / 60_000;
        expect(durationMinutes).toBe(90);
      }
      expect(results[0].startAtUtc).toBe('2026-03-01T09:00:00.000Z');
      expect(results[0].endAtUtc).toBe('2026-03-01T10:30:00.000Z');
      expect(results[2].startAtUtc).toBe('2026-03-03T09:00:00.000Z');
      expect(results[2].endAtUtc).toBe('2026-03-03T10:30:00.000Z');
    });
  });

  describe('soft-deleted exceptions ignored', () => {
    it('does not apply exception with deletedAt set', () => {
      const rule = makeRule('FREQ=DAILY', new Date('2026-03-01T09:00:00Z'));
      const range = {
        from: new Date('2026-03-01T00:00:00Z'),
        to: new Date('2026-03-03T23:59:59Z'),
      };
      const exceptions: ExceptionInput[] = [
        {
          exceptionKey: '2026-03-02T09:00:00.000Z',
          action: 'CANCEL',
          overridePayload: null,
          deletedAt: new Date('2026-03-05T00:00:00Z'),
        },
      ];

      const results = service.expandOne(timedMaster, rule, exceptions, range);

      expect(results).toHaveLength(3);
      expect(results[1].startAtUtc).toBe('2026-03-02T09:00:00.000Z');
    });
  });
});
