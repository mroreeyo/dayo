import { randomBytes } from 'node:crypto';
import {
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, AuditEntityType, MemberRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarPolicy } from '../../libs/policies/calendar.policy';
import { AuditService } from '../audit/audit.service';
import {
  CreateInviteDto,
  CreateInviteResponseDto,
  InviteDto,
  JoinByCodeResponseDto,
} from './invites.dto';

const INVITE_CODE_BYTES = 24;

function generateInviteCode(): string {
  return randomBytes(INVITE_CODE_BYTES).toString('base64url');
}

function toInviteDto(invite: {
  id: string;
  calendarId: string;
  code: string;
  expiresAt: Date | null;
  maxUses: number | null;
  useCount: number;
  revision: bigint;
}): InviteDto {
  return {
    id: invite.id,
    calendarId: invite.calendarId,
    code: invite.code,
    expiresAt: invite.expiresAt?.toISOString() ?? null,
    maxUses: invite.maxUses,
    useCount: invite.useCount,
    revision: invite.revision.toString(),
  };
}

@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: CalendarPolicy,
    private readonly audit: AuditService,
  ) {}

  async createInvite(
    userId: string,
    calendarId: string,
    dto: CreateInviteDto,
  ): Promise<CreateInviteResponseDto> {
    await this.policy.authorize(userId, calendarId, MemberRole.ADMIN);

    const invite = await this.prisma.invite.create({
      data: {
        calendarId,
        code: generateInviteCode(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        maxUses: dto.maxUses ?? null,
      },
    });

    await this.audit.record(
      userId,
      calendarId,
      AuditEntityType.INVITE,
      invite.id,
      AuditAction.CREATE,
      { maxUses: invite.maxUses, expiresAt: invite.expiresAt?.toISOString() ?? null },
    );

    return { invite: toInviteDto(invite) };
  }

  async joinByCode(
    userId: string,
    code: string,
  ): Promise<JoinByCodeResponseDto> {
    const invite = await this.prisma.invite.findUnique({ where: { code } });

    if (!invite) {
      throw new NotFoundException('Invalid invite code');
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new GoneException('Invite has expired');
    }

    if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
      throw new GoneException('Invite has reached maximum uses');
    }

    const existingMember = await this.prisma.calendarMember.findUnique({
      where: {
        calendarId_userId: {
          calendarId: invite.calendarId,
          userId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('Already a member of this calendar');
    }

    const member = await this.prisma.$transaction(async (tx) => {
      await tx.invite.update({
        where: { id: invite.id },
        data: { useCount: { increment: 1 } },
      });

      return tx.calendarMember.create({
        data: {
          calendarId: invite.calendarId,
          userId,
          role: MemberRole.MEMBER,
        },
        include: { calendar: true },
      });
    });

    await this.audit.record(
      userId,
      member.calendarId,
      AuditEntityType.MEMBER,
      member.id,
      AuditAction.JOIN,
      { inviteCode: code },
    );

    return {
      calendarId: member.calendarId,
      revision: member.calendar.revision.toString(),
    };
  }
}
