import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { RequestUser } from "../../common/auth/types";
import { NotificationsService } from "./notifications.service";
import {
  DeviceTokenResponseDto,
  RegisterDeviceTokenDto,
} from "./notifications.dto";

@ApiTags("Notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("/notifications/device-tokens")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @ApiOperation({ summary: "Register device token for push notifications" })
  @ApiCreatedResponse({ type: DeviceTokenResponseDto })
  @Post()
  register(
    @CurrentUser() user: RequestUser,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    return this.notifications.registerToken(user.id, dto);
  }

  @ApiOperation({ summary: "List device tokens for current user" })
  @ApiOkResponse({ type: [DeviceTokenResponseDto] })
  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.notifications.getTokensForUser(user.id);
  }

  @ApiOperation({ summary: "Unregister device token" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiOkResponse({ description: "Token removed" })
  @Delete("/:id")
  unregister(@CurrentUser() user: RequestUser, @Param("id") tokenId: string) {
    return this.notifications.unregisterToken(user.id, tokenId);
  }
}
