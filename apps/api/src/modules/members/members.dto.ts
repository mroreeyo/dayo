import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class MemberDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ example: 'alice@example.com' })
  email!: string;

  @ApiProperty({ example: 'Alice' })
  nickname!: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png', nullable: true })
  avatarUrl?: string | null;

  @ApiProperty({ enum: MemberRole, example: 'ADMIN' })
  role!: MemberRole;

  @ApiProperty({ description: 'Sync cursor revision', example: '12345' })
  revision!: string;
}

export class ListMembersResponseDto {
  @ApiProperty({ type: [MemberDto] })
  items!: MemberDto[];
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: MemberRole, example: 'ADMIN' })
  @IsEnum(MemberRole)
  role!: MemberRole;
}
