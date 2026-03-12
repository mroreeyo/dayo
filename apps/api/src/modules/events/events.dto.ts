import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";

// ─── Query ──────────────────────────────────────────────────

export class EventsQueryDto {
  @ApiProperty({ format: "uuid" })
  @IsString()
  calendarId!: string;

  @ApiProperty({
    description: "range start (UTC ISO)",
    example: "2026-02-01T00:00:00Z",
  })
  @IsISO8601()
  from!: string;

  @ApiProperty({
    description: "range end (UTC ISO)",
    example: "2026-03-01T00:00:00Z",
  })
  @IsISO8601()
  to!: string;

  @ApiPropertyOptional({
    description: "If true, server returns occurrences for recurring masters",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeOccurrences?: boolean;
}

// ─── Response DTOs ──────────────────────────────────────────

export class EventDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ format: "uuid" })
  calendarId!: string;

  @ApiProperty({ format: "uuid" })
  creatorId!: string;

  @ApiProperty({ example: "회의" })
  title!: string;

  @ApiPropertyOptional()
  note?: string | null;

  @ApiPropertyOptional()
  location?: string | null;

  @ApiProperty({ example: "Asia/Seoul" })
  timezone!: string;

  @ApiProperty({ example: false })
  allDay!: boolean;

  @ApiPropertyOptional({
    description: "UTC ISO",
    example: "2026-02-26T03:00:00Z",
  })
  startAtUtc?: string | null;

  @ApiPropertyOptional({
    description: "UTC ISO",
    example: "2026-02-26T04:00:00Z",
  })
  endAtUtc?: string | null;

  @ApiPropertyOptional({ description: "YYYY-MM-DD", example: "2026-02-26" })
  startDate?: string | null;

  @ApiPropertyOptional({
    description: "YYYY-MM-DD (exclusive)",
    example: "2026-02-27",
  })
  endDate?: string | null;

  @ApiPropertyOptional({ example: "#FFAA00", nullable: true })
  color?: string | null;

  @ApiPropertyOptional({
    description: "Reminder minutes before start",
    example: 10,
    nullable: true,
  })
  remindMinutes?: number | null;

  @ApiProperty({ example: 3 })
  version!: number;

  @ApiProperty({ description: "Sync cursor revision", example: "35000" })
  revision!: string;
}

export class OccurrenceDto {
  @ApiProperty({ format: "uuid" })
  recurringEventId!: string;

  @ApiProperty({
    description: "Timed: startAtUtc ISO, All-day: YYYY-MM-DD",
    example: "2026-02-26T03:00:00Z",
  })
  occurrenceKey!: string;

  @ApiProperty({ format: "uuid" })
  calendarId!: string;

  @ApiProperty({ example: false })
  allDay!: boolean;

  @ApiProperty({ example: "회의" })
  title!: string;

  @ApiPropertyOptional()
  note?: string | null;

  @ApiPropertyOptional()
  location?: string | null;

  @ApiPropertyOptional()
  color?: string | null;

  @ApiProperty({ example: "Asia/Seoul" })
  timezone!: string;

  @ApiPropertyOptional({ description: "UTC ISO" })
  startAtUtc?: string;

  @ApiPropertyOptional({ description: "UTC ISO" })
  endAtUtc?: string;

  @ApiPropertyOptional({ description: "YYYY-MM-DD" })
  startDate?: string;

  @ApiPropertyOptional({ description: "YYYY-MM-DD (exclusive)" })
  endDate?: string;

  @ApiProperty({ example: false })
  overridden!: boolean;
}

export class ListEventsResponseDto {
  @ApiProperty({ type: [EventDto] })
  items!: EventDto[];

  @ApiPropertyOptional({ type: [OccurrenceDto] })
  occurrences?: OccurrenceDto[];
}

// ─── Create ─────────────────────────────────────────────────

export class CreateEventDto {
  @ApiProperty({ format: "uuid" })
  @IsString()
  calendarId!: string;

  @ApiProperty({ example: "회의" })
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: "Asia/Seoul" })
  @IsString()
  timezone!: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  // Timed
  @ApiPropertyOptional({
    description: "Required when allDay=false",
    example: "2026-02-26T03:00:00Z",
  })
  @ValidateIf((o) => !o.allDay)
  @IsISO8601()
  startAtUtc!: string;

  @ApiPropertyOptional({
    description: "Required when allDay=false",
    example: "2026-02-26T04:00:00Z",
  })
  @ValidateIf((o) => !o.allDay)
  @IsISO8601()
  endAtUtc!: string;

  // All-day
  @ApiPropertyOptional({
    description: "Required when allDay=true",
    example: "2026-02-26",
  })
  @ValidateIf((o) => o.allDay)
  @IsString()
  startDate!: string;

  @ApiPropertyOptional({
    description: "Required when allDay=true (exclusive)",
    example: "2026-02-27",
  })
  @ValidateIf((o) => o.allDay)
  @IsString()
  endDate!: string;

  @ApiPropertyOptional({ example: "#FFAA00" })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  remindMinutes?: number;
}

// ─── Update ─────────────────────────────────────────────────

export class UpdateEventDto {
  @ApiProperty({ description: "Optimistic lock version", example: 3 })
  @IsInt()
  @Min(1)
  version!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: "Asia/Seoul" })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  startAtUtc?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  endAtUtc?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  remindMinutes?: number;
}
