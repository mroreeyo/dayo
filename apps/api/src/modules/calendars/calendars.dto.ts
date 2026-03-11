import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MemberRole } from "@prisma/client";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateCalendarDto {
  @ApiProperty({ example: "가족" })
  @IsString()
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({ example: "#FFAA00", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;
}

export class UpdateCalendarDto {
  @ApiPropertyOptional({ example: "가족(수정)" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: "#00AAFF", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;
}

export class CalendarItemDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "가족" })
  name!: string;

  @ApiPropertyOptional({ example: "#FFAA00", nullable: true })
  color?: string | null;

  @ApiProperty({ enum: MemberRole, example: "OWNER" })
  role!: MemberRole;

  @ApiProperty({ description: "Sync cursor revision", example: "12345" })
  revision!: string;
}

export class ListCalendarsResponseDto {
  @ApiProperty({ type: [CalendarItemDto] })
  items!: CalendarItemDto[];
}
