import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { RequestUser } from "../../common/auth/types";
import { OkRevisionResponseDto } from "../../common/dto/ok-revision.dto";
import { EventsService } from "./events.service";
import {
  CreateEventDto,
  EventsQueryDto,
  ListEventsResponseDto,
  UpdateEventDto,
} from "./events.dto";

@ApiTags("Events")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("/events")
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @ApiOperation({ summary: "List events within range" })
  @ApiQuery({ name: "calendarId", required: true })
  @ApiQuery({ name: "from", required: true })
  @ApiQuery({ name: "to", required: true })
  @ApiQuery({ name: "includeOccurrences", required: false })
  @ApiOkResponse({ type: ListEventsResponseDto })
  @Get()
  list(@CurrentUser() user: RequestUser, @Query() q: EventsQueryDto) {
    return this.events.listEvents(user.id, q);
  }

  @ApiOperation({ summary: "Create event" })
  @ApiCreatedResponse({ type: OkRevisionResponseDto })
  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateEventDto) {
    return this.events.createEvent(user.id, dto);
  }

  @ApiOperation({ summary: "Update event (optimistic lock)" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiOkResponse({ type: OkRevisionResponseDto })
  @Patch("/:id")
  update(
    @CurrentUser() user: RequestUser,
    @Param("id") eventId: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.events.updateEvent(user.id, eventId, dto);
  }

  @ApiOperation({ summary: "Delete event (soft delete)" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiOkResponse({ type: OkRevisionResponseDto })
  @Delete("/:id")
  remove(@CurrentUser() user: RequestUser, @Param("id") eventId: string) {
    return this.events.deleteEvent(user.id, eventId);
  }
}
