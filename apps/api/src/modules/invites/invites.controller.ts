import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { RequestUser } from "../../common/auth/types";
import { InvitesService } from "./invites.service";
import {
  CreateInviteDto,
  CreateInviteResponseDto,
  JoinByCodeResponseDto,
} from "./invites.dto";

@ApiTags("Invites")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class InvitesController {
  constructor(private readonly invites: InvitesService) {}

  @ApiOperation({ summary: "Create an invite code for a calendar (ADMIN+)" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiCreatedResponse({ type: CreateInviteResponseDto })
  @Post("/calendars/:id/invites")
  createInvite(
    @CurrentUser() user: RequestUser,
    @Param("id") calendarId: string,
    @Body() dto: CreateInviteDto,
  ) {
    return this.invites.createInvite(user.id, calendarId, dto);
  }

  @ApiOperation({ summary: "Join a calendar using an invite code" })
  @ApiParam({ name: "code" })
  @ApiCreatedResponse({ type: JoinByCodeResponseDto })
  @Post("/invites/:code/join")
  joinByCode(@CurrentUser() user: RequestUser, @Param("code") code: string) {
    return this.invites.joinByCode(user.id, code);
  }
}
