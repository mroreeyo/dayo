import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarPolicy } from '../../libs/policies/calendar.policy';
import {
  ListMembersResponseDto,
  MemberDto,
  UpdateMemberRoleDto,
} from './members.dto';
import { OkRevisionResponseDto } from '../../common/dto/ok-revision.dto';

const ROLE_LEVEL: Record<MemberRole, number> = {
  OWNER: 30,
  ADMIN: 20,
  MEMBER: 10,
};

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: CalendarPolicy,
  ) {}

  async listMembers(
    userId: string,
    calendarId: string,
  ): Promise<ListMembersResponseDto> {
    await this.policy.authorize(userId, calendarId, MemberRole.MEMBER);

    const members = await this.prisma.calendarMember.findMany({
      where: { calendarId },
      include: { user: true },
    });

    const items: MemberDto[] = members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      nickname: m.user.nickname,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      revision: m.revision.toString(),
    }));

    return { items };
  }

  async updateRole(
    actorId: string,
    calendarId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<MemberDto> {
    const actor = await this.policy.authorize(actorId, calendarId, MemberRole.ADMIN);

    const target = await this.prisma.calendarMember.findUnique({
      where: { calendarId_userId: { calendarId, userId: targetUserId } },
      include: { user: true },
    });

    if (!target) {
      throw new NotFoundException('Target member not found');
    }

    if (target.role === MemberRole.OWNER) {
      throw new ForbiddenException('Cannot change OWNER role');
    }

    if (ROLE_LEVEL[dto.role] >= ROLE_LEVEL[actor.role]) {
      throw new ForbiddenException('Cannot assign role equal to or higher than your own');
    }

    if (dto.role === MemberRole.OWNER) {
      throw new ForbiddenException('Cannot assign OWNER role');
    }

    const updated = await this.prisma.calendarMember.update({
      where: { calendarId_userId: { calendarId, userId: targetUserId } },
      include: { user: true },
      data: { role: dto.role },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      email: updated.user.email,
      nickname: updated.user.nickname,
      avatarUrl: updated.user.avatarUrl,
      role: updated.role,
      revision: updated.revision.toString(),
    };
  }

  async removeMember(
    actorId: string,
    calendarId: string,
    targetUserId: string,
  ): Promise<OkRevisionResponseDto> {
    const isSelfLeave = actorId === targetUserId;

    if (isSelfLeave) {
      const self = await this.policy.authorize(actorId, calendarId, MemberRole.MEMBER);

      if (self.role === MemberRole.OWNER) {
        throw new ForbiddenException('OWNER cannot leave the calendar');
      }
    } else {
      const actor = await this.policy.authorize(actorId, calendarId, MemberRole.ADMIN);

      const target = await this.prisma.calendarMember.findUnique({
        where: { calendarId_userId: { calendarId, userId: targetUserId } },
      });

      if (!target) {
        throw new NotFoundException('Target member not found');
      }

      if (ROLE_LEVEL[target.role] >= ROLE_LEVEL[actor.role]) {
        throw new ForbiddenException('Cannot remove a member with equal or higher role');
      }
    }

    const deleted = await this.prisma.calendarMember.delete({
      where: { calendarId_userId: { calendarId, userId: targetUserId } },
    });

    return {
      ok: true,
      revision: deleted.revision.toString(),
    };
  }
}
