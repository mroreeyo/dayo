import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "./prisma.service";

describe("PrismaService", () => {
  let service: PrismaService;

  const dbUrl = process.env.DATABASE_URL;
  const describeIfDb = dbUrl ? describe : describe.skip;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describeIfDb("connectivity", () => {
    beforeAll(async () => {
      await service.onModuleInit();
    });

    afterAll(async () => {
      await service.onModuleDestroy();
    });

    it("should connect to the database", async () => {
      const result = await service.$queryRaw<
        Array<{ now: Date }>
      >`SELECT NOW() as now`;
      expect(result).toHaveLength(1);
      expect(result[0].now).toBeInstanceOf(Date);
    });

    it("should have all expected tables accessible", async () => {
      const [
        users,
        calendars,
        members,
        invites,
        events,
        rules,
        exceptions,
        logs,
        tokens,
      ] = await Promise.all([
        service.user.findMany({ take: 1 }),
        service.calendar.findMany({ take: 1 }),
        service.calendarMember.findMany({ take: 1 }),
        service.invite.findMany({ take: 1 }),
        service.event.findMany({ take: 1 }),
        service.eventRecurrenceRule.findMany({ take: 1 }),
        service.eventException.findMany({ take: 1 }),
        service.auditLog.findMany({ take: 1 }),
        service.deviceToken.findMany({ take: 1 }),
      ]);

      expect(users).toBeDefined();
      expect(calendars).toBeDefined();
      expect(members).toBeDefined();
      expect(invites).toBeDefined();
      expect(events).toBeDefined();
      expect(rules).toBeDefined();
      expect(exceptions).toBeDefined();
      expect(logs).toBeDefined();
      expect(tokens).toBeDefined();
    });

    it("should create and read a user (round-trip)", async () => {
      const email = `test-${Date.now()}@example.com`;
      const user = await service.user.create({
        data: {
          email,
          nickname: "Test User",
        },
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.nickname).toBe("Test User");
      expect(user.createdAt).toBeInstanceOf(Date);

      await service.user.delete({ where: { id: user.id } });
    });
  });
});
