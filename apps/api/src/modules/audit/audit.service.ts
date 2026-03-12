import { Injectable } from "@nestjs/common";
import { Prisma, AuditAction, AuditEntityType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    actorId: string,
    calendarId: string,
    entityType: AuditEntityType,
    entityId: string,
    action: AuditAction,
    diff?: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        calendarId,
        userId: actorId,
        entityType,
        entityId,
        action,
        payload: diff ? (diff as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  }
}
