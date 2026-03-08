import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const ROLE_LEVEL: Record<MemberRole, number> = {
  OWNER: 30,
  ADMIN: 20,
  MEMBER: 10,
};

@Injectable()
export class CalendarPolicy {
  constructor(private readonly prisma: PrismaService) {}

  async authorize(
    userId: string,
    calendarId: string,
    minRole: MemberRole,
  ) {
    const calendar = await this.prisma.calendar.findUnique({
      where: { id: calendarId },
    });

    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    const member = await this.prisma.calendarMember.findUnique({
      where: { calendarId_userId: { calendarId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this calendar');
    }

    if (ROLE_LEVEL[member.role] < ROLE_LEVEL[minRole]) {
      throw new ForbiddenException(
        `Requires ${minRole} role or higher`,
      );
    }

    return member;
  }
}
