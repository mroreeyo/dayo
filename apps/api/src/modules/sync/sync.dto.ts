import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches } from "class-validator";

export class SyncQueryDto {
  @ApiProperty({ format: "uuid" })
  @IsString()
  calendarId!: string;

  @ApiPropertyOptional({ description: "last revision cursor", example: "0" })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]+$/)
  since?: string;
}

export class SyncEntityDeleteDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ example: "35000" }) revision!: string;
  @ApiPropertyOptional({ example: "2026-02-26T01:02:03Z" }) deletedAt?: string;
}

export class SyncBucketDto {
  @ApiProperty({
    description: "Full entity objects with at least id and revision fields",
    type: "array",
    items: {
      type: "object",
      properties: { id: { type: "string" }, revision: { type: "string" } },
    },
  })
  upserts!: Array<{ id: string; revision: string; [key: string]: unknown }>;

  @ApiProperty({ type: [SyncEntityDeleteDto] })
  deletes!: SyncEntityDeleteDto[];
}

export class SyncResponseDto {
  @ApiProperty({ example: "35000" }) next!: string;
  @ApiProperty({ type: SyncBucketDto }) calendars!: SyncBucketDto;
  @ApiProperty({ type: SyncBucketDto }) members!: SyncBucketDto;
  @ApiProperty({ type: SyncBucketDto }) invites!: SyncBucketDto;
  @ApiProperty({ type: SyncBucketDto }) events!: SyncBucketDto;
}
