import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, AuditAction, AuditEntityType } from '@prisma/client';
import { AuditService } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  auditLog: {
    create: jest.fn(),
  },
};

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('creates audit log with all fields', async () => {
    mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });

    await service.record(
      'user-1',
      'cal-1',
      AuditEntityType.CALENDAR,
      'cal-1',
      AuditAction.CREATE,
      { name: 'Test Calendar' },
    );

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        calendarId: 'cal-1',
        userId: 'user-1',
        entityType: AuditEntityType.CALENDAR,
        entityId: 'cal-1',
        action: AuditAction.CREATE,
        payload: { name: 'Test Calendar' },
      },
    });
  });

  it('stores Prisma.JsonNull when diff is omitted', async () => {
    mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-2' });

    await service.record(
      'user-1',
      'cal-1',
      AuditEntityType.CALENDAR,
      'cal-1',
      AuditAction.DELETE,
    );

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        payload: Prisma.JsonNull,
      }),
    });
  });

  it('stores Prisma.JsonNull when diff is undefined', async () => {
    mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-3' });

    await service.record(
      'user-1',
      'cal-1',
      AuditEntityType.EVENT,
      'evt-1',
      AuditAction.UPDATE,
      undefined,
    );

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        payload: Prisma.JsonNull,
      }),
    });
  });

  it('maps actorId to userId field', async () => {
    mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-4' });

    await service.record(
      'actor-123',
      'cal-1',
      AuditEntityType.MEMBER,
      'member-1',
      AuditAction.JOIN,
    );

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'actor-123',
      }),
    });
  });
});
