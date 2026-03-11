import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { RequestUser } from "../../common/auth/types";
import { SyncService } from "./sync.service";
import { SyncQueryDto, SyncResponseDto } from "./sync.dto";

@ApiTags("Sync")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("/sync")
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  @ApiOperation({ summary: "Sync changes since revision cursor" })
  @ApiQuery({ name: "calendarId", required: true })
  @ApiQuery({ name: "since", required: false })
  @ApiOkResponse({ type: SyncResponseDto })
  @Get()
  run(@CurrentUser() user: RequestUser, @Query() q: SyncQueryDto) {
    return this.sync.syncCalendar(user.id, q.calendarId, q.since ?? "0");
  }
}
