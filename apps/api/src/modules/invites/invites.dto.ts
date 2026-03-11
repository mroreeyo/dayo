import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsInt, IsOptional, Min } from "class-validator";

export class CreateInviteDto {
  @ApiPropertyOptional({
    description: "Invite expiration datetime (ISO 8601)",
    example: "2026-03-15T00:00:00Z",
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: "Maximum number of times this invite can be used",
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;
}

export class InviteDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ format: "uuid" })
  calendarId!: string;

  @ApiProperty({
    description: "High-entropy invite code (32+ chars)",
    example: "a1b2c3d4e5f6...",
  })
  code!: string;

  @ApiPropertyOptional({ description: "Expiration datetime", nullable: true })
  expiresAt!: string | null;

  @ApiPropertyOptional({ description: "Max allowed uses", nullable: true })
  maxUses!: number | null;

  @ApiProperty({ description: "Current use count", example: 0 })
  useCount!: number;

  @ApiProperty({ description: "Sync cursor revision", example: "12345" })
  revision!: string;
}

export class CreateInviteResponseDto {
  @ApiProperty({ type: InviteDto })
  invite!: InviteDto;
}

export class JoinByCodeResponseDto {
  @ApiProperty({ format: "uuid", description: "Calendar ID joined" })
  calendarId!: string;

  @ApiProperty({ description: "Sync cursor revision", example: "12345" })
  revision!: string;
}
