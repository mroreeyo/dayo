import { PrismaClient } from '@prisma/client';

/**
 * Minimal Prisma connectivity test.
 * Verifies that the generated client can connect to the database
 * and that the schema models are accessible.
 *
 * Requires: DATABASE_URL env var pointing to a running Postgres instance
 * with migrations applied (`npx prisma migrate dev`).
 */
describe('PrismaService (connectivity)', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to the database', async () => {
    const result = await prisma.$queryRaw<
      Array<{ now: Date }>
    >`SELECT NOW() as now`;
    expect(result).toHaveLength(1);
    expect(result[0].now).toBeInstanceOf(Date);
  });

  it('should have all expected tables accessible', async () => {
    const [users, calendars, members, invites, events, rules, exceptions, logs, tokens] =
      await Promise.all([
        prisma.user.findMany({ take: 1 }),
        prisma.calendar.findMany({ take: 1 }),
        prisma.calendarMember.findMany({ take: 1 }),
        prisma.invite.findMany({ take: 1 }),
        prisma.event.findMany({ take: 1 }),
        prisma.eventRecurrenceRule.findMany({ take: 1 }),
        prisma.eventException.findMany({ take: 1 }),
        prisma.auditLog.findMany({ take: 1 }),
        prisma.deviceToken.findMany({ take: 1 }),
      ]);

    expect(users).toEqual([]);
    expect(calendars).toEqual([]);
    expect(members).toEqual([]);
    expect(invites).toEqual([]);
    expect(events).toEqual([]);
    expect(rules).toEqual([]);
    expect(exceptions).toEqual([]);
    expect(logs).toEqual([]);
    expect(tokens).toEqual([]);
  });

  it('should create and read a user (round-trip)', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        nickname: 'Test User',
      },
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe('test@example.com');
    expect(user.nickname).toBe('Test User');
    expect(user.createdAt).toBeInstanceOf(Date);

    await prisma.user.delete({ where: { id: user.id } });
  });
});
